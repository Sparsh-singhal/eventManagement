const express = require("express");
const userSchema = require("../model/userSchema");
const eventSchema = require("../model/eventSchema");
const feedbackSchema = require("../model/feedbackSchema");
const notificationSchema = require("../model/notificationSchema");
const eventRoute = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

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
    if(req.body.password && !req.body.password.startsWith('$2')) {
        req.body.password = bcrypt.hashSync(req.body.password, 10);
    }
    userSchema.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), {$set:req.body}, {new: true}, (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

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
// Notifications

eventRoute.get("/notifications", authMiddleware, async (req, res) => {
    try {
        const notifications = await notificationSchema.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

eventRoute.put("/notifications/mark-read", authMiddleware, async (req, res) => {
    try {
        await notificationSchema.updateMany({ userId: req.user.id, readStatus: false }, { readStatus: true });
        res.json({ message: "Notifications marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -----------------------------------------------------------------------------------------
// Events

eventRoute.get("/event-list", async (req, res) => {
    try {
        const { category, search, status, page = 1, limit = 10 } = req.query;
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

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const events = await eventSchema.find(query)
            .populate('organizerId', 'fullName email')
            .sort({ date: 1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await eventSchema.countDocuments(query);

        res.json({
            events,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page)
        });
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
        if(err) {
            if (err.message === 'Event date cannot be in the past') {
                return res.status(400).json({ error: err.message });
            }
            return res.status(500).json({ error: err.message });
        }
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

// Advanced Registration Endpoint
eventRoute.post("/register-event/:id", authMiddleware, async (req, res) => {
    // Note: We use basic async operations without a session since MongoDB standalone doesn't support transactions easily
    // For full production with replica sets, mongoose.startSession() would be used.
    try {
        const eventId = mongoose.Types.ObjectId(req.params.id);
        const userId = mongoose.Types.ObjectId(req.user.id);
        
        const event = await eventSchema.findById(eventId);
        const user = await userSchema.findById(userId);
        
        if (!event) throw new Error("Event not found");
        if (!user) throw new Error("User not found");
        
        const isRegistered = event.registeredUsers.some(u => u.username === user.username);
        const isWaitlisted = event.waitlist?.some(u => u.username === user.username);
        
        if (isRegistered || isWaitlisted) {
            throw new Error("You are already registered or waitlisted for this event");
        }

        const capacity = event.capacity || event.slots || 0;
        const currentRegistrations = event.registeredUsers.length;

        if (currentRegistrations >= capacity && capacity > 0) {
            event.waitlist = event.waitlist || [];
            event.waitlist.push({
                username: user.username,
                fullName: user.fullName,
                userId: user._id
            });
            await event.save();
            
            await notificationSchema.create({
                userId: user._id,
                message: `You have been added to the waitlist for ${event.name}`
            });

            return res.json({ message: "Event is full. You have been added to the waitlist.", waitlisted: true });
        } else {
            const ticketId = uuidv4();
            const registrationRecord = {
                username: user.username,
                fullName: user.fullName,
                ticketId,
                attended: false
            };
            
            event.registeredUsers.push(registrationRecord);
            event.slots = capacity > 0 ? capacity - event.registeredUsers.length : 0; 
            
            const eventSnapshot = { ...event.toObject(), ticketId, attended: false };
            user.bookedEvents.push(eventSnapshot);
            
            await event.save();
            await user.save();
            
            await notificationSchema.create({
                userId: user._id,
                message: `Successfully registered for ${event.name}! Your ticket ID is ${ticketId}`
            });

            return res.json({ message: "Registration successful", ticketId, waitlisted: false });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Cancel Registration & Waitlist Promotion
eventRoute.post("/cancel-registration/:id", authMiddleware, async (req, res) => {
    try {
        const eventId = mongoose.Types.ObjectId(req.params.id);
        const userId = mongoose.Types.ObjectId(req.user.id);
        
        const event = await eventSchema.findById(eventId);
        const user = await userSchema.findById(userId);
        
        if (!event) throw new Error("Event not found");

        const regIndex = event.registeredUsers.findIndex(u => u.username === user.username);
        if (regIndex === -1) {
            const waitIndex = event.waitlist?.findIndex(u => u.username === user.username);
            if (waitIndex !== -1 && event.waitlist) {
                event.waitlist.splice(waitIndex, 1);
                await event.save();
                return res.json({ message: "Removed from waitlist" });
            }
            throw new Error("Not registered for this event");
        }

        event.registeredUsers.splice(regIndex, 1);
        
        user.bookedEvents = user.bookedEvents.filter(e => e._id?.toString() !== eventId.toString() && e.ticketId !== event.registeredUsers[regIndex]?.ticketId);
        await user.save();

        if (event.waitlist && event.waitlist.length > 0) {
            const promotedUserBasic = event.waitlist.shift(); 
            const promotedUser = await userSchema.findById(promotedUserBasic.userId);
            
            if (promotedUser) {
                const ticketId = uuidv4();
                event.registeredUsers.push({
                    username: promotedUser.username,
                    fullName: promotedUser.fullName,
                    ticketId,
                    attended: false
                });

                const eventSnapshot = { ...event.toObject(), ticketId, attended: false };
                promotedUser.bookedEvents.push(eventSnapshot);
                await promotedUser.save();

                await notificationSchema.create({
                    userId: promotedUser._id,
                    message: `A spot opened up! You are now registered for ${event.name}. Ticket ID: ${ticketId}`
                });
            }
        }
        
        const capacity = event.capacity || event.slots || 0;
        event.slots = capacity > 0 ? capacity - event.registeredUsers.length : 0;
        
        await event.save();
        res.json({ message: "Registration cancelled successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Mark Attendance
eventRoute.post("/mark-attendance/:eventId/:username", authMiddleware, roleMiddleware(['admin', 'organizer']), async (req, res) => {
    try {
        const eventId = mongoose.Types.ObjectId(req.params.eventId);
        const event = await eventSchema.findById(eventId);
        if (!event) return res.status(404).json({ error: "Event not found" });

        if (req.user.role === 'organizer' && event.organizerId?.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized to modify attendance for this event" });
        }

        const userIndex = event.registeredUsers.findIndex(u => u.username === req.params.username);
        if (userIndex === -1) return res.status(404).json({ error: "User not registered for this event" });

        event.registeredUsers[userIndex].attended = !event.registeredUsers[userIndex].attended;
        
        event.markModified('registeredUsers');
        await event.save();
        
        res.json({ message: "Attendance updated", user: event.registeredUsers[userIndex] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics Dashboard
eventRoute.get("/dashboard-stats", authMiddleware, async (req, res) => {
    try {
        let stats = {
            totalEvents: 0,
            totalRegistrations: 0,
            activeEvents: 0,
            totalWaitlisted: 0
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
            if (event.waitlist) {
                stats.totalWaitlisted += event.waitlist.length;
            }
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Feedback
eventRoute.post("/post-feedback", (req,res) => {
    feedbackSchema.create(req.body, (err,data) => {
        if(err) return res.status(500).json(err);
        res.json(data);
    })
});

module.exports = eventRoute;