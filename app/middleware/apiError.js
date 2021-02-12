const errorFactory = require('error-factory')

/**
* ApiError module.
* @module middleware/apiError
*/
const ApiError = module.exports = {
    BadRequest: errorFactory('BadRequest', ['message', 'code', 'context']),
    Forbidden: errorFactory('Forbidden', ['message', 'code', 'context']),
    Conflict: errorFactory('Conflict', ['message', 'code', 'context']),
    ResetContent: errorFactory('ResetContent', ['message', 'code', 'params', 'context']),
    Unauthorized: errorFactory('Unauthorized', ['message', 'code', 'context']),
    NotFound: errorFactory('NotFound', ['message', 'code', 'context']),
    getHttpError: getHttpError,
    getError: getError
}

function getHttpError(language, err, cb) {
    var httpError = {
        'statusCode': 500,
        'error': err
    }
    if (err instanceof ApiError.BadRequest) {
        httpError.statusCode = 400;
    } else if (err instanceof ApiError.Forbidden) {
        httpError.statusCode = 403;
    } else if (err instanceof ApiError.Conflict) {
        httpError.statusCode = 409;
    } else if (err instanceof ApiError.ResetContent) {
        httpError.statusCode = 417;
    } else if (err instanceof ApiError.Unauthorized) {
        httpError.statusCode = 401;
    } else if (err instanceof ApiError.NotFound) {
        httpError.statusCode = 404;
    }
    httpError.error = err;
    cb(null, httpError);
}
function getError(err) {
    let send;
    getHttpError("en", err, (err, httpResponse) => {
        if (err) {
            send = { code: 500, details: err }
        } else {
            send = { code: httpResponse.statusCode, details: httpResponse.error.message }
        }
    });
    return send
}