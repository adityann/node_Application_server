exports.response = responseObject;


/*********** function Object ********/
function responseObject(status, code, message, data) {
    let object = {
        'status': status,
        "code": code,
    }
    if (message) object.message = message;
    if (data) object.data = data;
    return object;
}