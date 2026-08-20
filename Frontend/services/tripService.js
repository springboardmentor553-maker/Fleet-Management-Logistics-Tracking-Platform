import api from "../api/axios";


export const getTrips=()=>{

return api.get("/trips");

}



export const createTrip=(data)=>{

return api.post(
"/trips",
data
);

}