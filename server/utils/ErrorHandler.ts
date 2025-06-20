

class ErrorHandler extends Error{
    statusCode: Number;
    constructor(message:any, statusCode:Number){
        super(message);  // Calls the parent Error class constructor to set the message.
        this.statusCode= statusCode;


        Error.captureStackTrace(this,this.constructor);

    }
}
export default ErrorHandler;