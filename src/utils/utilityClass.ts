  

class ErrorHandler extends Error{
      
    constructor(public message: string, public statusCode:number){
        super(message);
        this.statusCode=statusCode;
        if (!message) {
            this.message = "Internal Server Error";
        }
    }
}


export default ErrorHandler;