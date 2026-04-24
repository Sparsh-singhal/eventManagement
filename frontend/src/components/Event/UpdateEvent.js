import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axiosConfig";
import EventRegistrationForm from "./eventform";

function UpdateEvent() {
    const { id } = useParams();
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
    if(!id) return;
    api.get("/check-event/" + id)
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
    id = {id}
    registeredUsersValue = {registeredUsersValue}
    />
    )
};
export default UpdateEvent;
