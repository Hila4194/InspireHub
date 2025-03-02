import dotenv from "dotenv";
import initApp from "./server";
dotenv.config();

const port = process.env.PORT;

initApp().then((app) => {
    app.listen(port, ()=>{
        console.log(`Server is running on port http://localhost:${port}`);
    });
}).catch(() => {
    console.log("Error fail starting the server");
});