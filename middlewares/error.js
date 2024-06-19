export const errorMiddleware=(err,req,res,next)=>{
    err.message=err.message || "Internal Server Error"
    err.statusCode=err.statusCode || 500
   
    if(err.code===11000){
        err.message=`${Object.keys(err.keyPattern).join(",")} already exists`;
        err.statusCode=400;
    }

    if(err.name==="CastError"){
        err.message=`Invalid format of ${err.path}`;
        err.statusCode=400;
    }

    res.status(err.statusCode).json({
        success:false,
        message:err.message,
    })
}


export const TryCatch=(controller)=>async(req, res, next)=>{
    try {
        await controller(req, res, next);
    } catch (error) {
        next(error);
    }
}