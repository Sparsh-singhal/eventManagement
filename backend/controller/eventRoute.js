const express = require("express");
const userSchema = require("../model/userSchema");
const eventSchema = require("../model/eventSchema");
const feedbackSchema = require("../model/feedbackSchema");
const eventRoute = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_eventmanagement123";

// Middleware
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

const roleMiddleware = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden. You do not have the required role.' });
    }
    next();
};

// --------------------------------------------------------------------------------
// Auth & User Management

eventRoute.post("/register", async (req, res) => {
    try {
        const existingUser = await userSchema.findOne({ username: req.body.username });
        if (existingUser) return res.status(400).json({ error: "Username already exists" });

        const existingEmail = await userSchema.findOne({ email: req.body.email });
        if (existingEmail) return res.status(400).json({ error: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const newUser = new userSchema({
            ...req.body,
            password: hashedPassword,
        });

        const savedUser = await newUser.save();
        
        // Auto-login after register
        const token = jwt.sign({ id: savedUser._id, username: savedUser.username, role: savedUser.role }, JWT_SECRET, { expiresIn: '24h' });
        
        res.status(200).json({ token, user: savedUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

eventRoute.post("/login", async (req, res) => {
    try {
        const user = await userSchema.findOne({ username: req.body.username });
        if (!user) return res.status(400).json({ error: "Incorrect username or password" });

        // Backward compatibility for plaintext passwords in existing DB
        let validPassword = false;
        if(user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            validPassword = await bcrypt.compare(req.body.password, user.password);
        } else {
            validPassword = req.body.password === user.password;
        }

        if (!validPassword) return res.status(400).json({ error: "Incorrect username or password" });

        const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

eventRoute.get("/user-list", authMiddleware, roleMiddleware(['admin']), (req, res) => {
    userSchema.find((err, data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

eventRoute.route("/check-user/:uname")
.get((req, res) => {
    userSchema.findOne({username: req.params.uname}, (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

eventRoute.route("/update-user/:id")
.get(authMiddleware, (req, res) => {
    userSchema.findById(mongoose.Types.ObjectId(req.params.id), (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
}).put(authMiddleware, (req, res) => {
    // If password is being updated, hash it
    if(req.body.password && !req.body.password.startsWith('$2')) {
        req.body.password = bcrypt.hashSync(req.body.password, 10);
    }
    userSchema.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), {$set:req.body}, {new: true}, (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

eventRoute.delete("/delete-user/:id", authMiddleware, roleMiddleware(['admin']), (req,res)=>{
    userSchema.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

// Favorites
eventRoute.post("/toggle-favorite/:eventId", authMiddleware, async (req, res) => {
    try {
        const user = await userSchema.findById(req.user.id);
        const eventId = mongoose.Types.ObjectId(req.params.eventId);
        
        const index = user.favorites.indexOf(eventId);
        if (index > -1) {
            user.favorites.splice(index, 1);
        } else {
            user.favorites.push(eventId);
        }
        await user.save();
        res.json({ favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// -----------------------------------------------------------------------------------------
// Events

eventRoute.get("/event-list", async (req, res) => {
    try {
        const { category, search, status } = req.query;
        let query = {};
        
        if (category && category !== 'All') query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { club: { $regex: search, $options: 'i' } }
            ];
        }

        const events = await eventSchema.find(query).populate('organizerId', 'fullName email').sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

eventRoute.route("/check-event/:id")
.get((req, res) => {
    eventSchema.findById(mongoose.Types.ObjectId(req.params.id)).populate('organizerId', 'fullName email').exec((err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

eventRoute.post("/create-event", authMiddleware, roleMiddleware(['admin', 'organizer']), (req,res) => {
    const eventData = {
        ...req.body,
        organizerId: req.user.id
    };
    eventSchema.create(eventData, (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

eventRoute.route("/update-event/:id")
.get((req, res) => {
    eventSchema.findById(mongoose.Types.ObjectId(req.params.id), (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
}).put(authMiddleware, (req, res) => {
    eventSchema.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), {$set:req.body}, {new: true}, (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

eventRoute.delete("/delete-event/:id", authMiddleware, roleMiddleware(['admin', 'organizer']), (req,res)=>{
    eventSchema.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

// Analytics Dashboard
eventRoute.get("/dashboard-stats", authMiddleware, async (req, res) => {
    try {
        let stats = {
            totalEvents: 0,
            totalRegistrations: 0,
            activeEvents: 0
        };

        let eventQuery = {};
        if (req.user.role === 'organizer') {
            eventQuery.organizerId = mongoose.Types.ObjectId(req.user.id);
        }

        const events = await eventSchema.find(eventQuery);
        stats.totalEvents = events.length;
        stats.activeEvents = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length;
        
        events.forEach(event => {
            if (event.registeredUsers) {
                stats.totalRegistrations += event.registeredUsers.length;
            }
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// -----------------------------------------------------------------------------------------
// Feedback
eventRoute.post("/post-feedback", (req,res) => {
    feedbackSchema.create(req.body, (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

module.exports = eventRoute;