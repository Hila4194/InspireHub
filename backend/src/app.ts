import dotenv from "dotenv";
import initApp from "./server";
dotenv.config();

const port = process.env.PORT || 3000;

initApp().then((app) => {
    app.listen(port, ()=>{
        console.log(`Server is running on port http://localhost:${port}`);
    });
}).catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
});