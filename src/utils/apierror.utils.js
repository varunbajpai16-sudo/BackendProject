class Apierror extends Error {
  constructor(statusCode, message,error=[],stack=""){
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = error;
    this.stack = stack;
    this.success = false;
  }
}
export default Apierror;