import { useState, useEffect } from "react";
import Axios from "axios";
import EventRegistrationForm from "./eventform";

function UpdateEvent() {
    const [formData, setFormData] = useState({
        nameValue: "",
        startValue: "",
        endTimeValue: "",
        dateValue: "",
        placeValue: "",
        descriptionValue: "",
        clubValue: "",
        slotsValue: "",
      });

  const [registeredUsersValue, setRegisteredUsersValue] = useState();

  useEffect(() => {
    const eventID = localStorage.getItem("eventID");
    Axios.get("https://eventmanagement-0tom.onrender.com/eventRoute/check-event/" + eventID)
      .then(response => {
            // console.log(response.data);
          setFormData(
            {
   
              nameValue: `${response.data.name}`,
              startTimeValue: `${response.data.startTime}`,
              endTimeValue: `${response.data.endTime}`,
              dateValue: `${response.data.date}`,
              placeValue: `${response.data.place}`,
              descriptionValue: `${response.data.description}`,
              clubValue: `${response.data.club}`,
              slotsValue: `${response.data.slots}`,
               
              
            }
          );
          setRegisteredUsersValue(response.data.registeredUsers);
          console.log("From event page:",formData, registeredUsersValue);
      })
      .catch(error => {
        console.error('Error fetching event details:', error);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.nameValue, formData.startTimeValue, formData.endTimeValue,
        formData.dateValue, formData.placeValue, formData.descriptionValue,
        formData.clubValue, formData.slotsValue]); 


  return(
    <EventRegistrationForm
    nameValue = {formData.nameValue}
    startTimeValue = {formData.startTimeValue}
    endTimeValue = {formData.endTimeValue}
    dateValue = {formData.dateValue}
    placeValue = {formData.placeValue}
    descriptionValue = {formData.descriptionValue}
    clubValue = {formData.clubValue}
    slotsValue = {formData.slotsValue}
    action = "update"
    id = {localStorage.getItem("eventID")}
    registeredUsersValue = {registeredUsersValue}
    />
    )
};
export default UpdateEvent;
