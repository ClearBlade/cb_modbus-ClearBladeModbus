/**
 * Type: Library
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
const isDebug01 = DEBUG_LOG.SS_PROCESS_MODBUS_CONFIG;

function isEmptyArray(array) {
    if ((array instanceof Array) && array.length > 0) {
        return false
    } else {
        return true;
    }
}

function isEmptyOrNullVal(value) {
    return value == null || value.length === 0;
}

function isEmptyString(obj) {
    if (obj == null || obj == undefined || typeof obj != 'string' || obj == "" || obj.trim().length === 0) {
        return true;
    } else {
        return false;
    }
}

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

function isValidNumber(obj) {
    if (typeof obj == "number") {
        return true;
    }
    return false;
}

function hexToDecimal(hexString) {
    return parseInt(hexString, 16);
}

function calculateDiff(hex1, hex2) {
    if (hex1 < hex2) {
        if (isDebug01) {
            log(hex1 + ' vaue must be greater than hex2 ' + hex2);
        }
        return -1;
    }
    if (isDebug01) {
        log(hexToDecimal(hex1));
        log(hexToDecimal(hex2))
    }
    // As per Ryan's comment Address are in decimal
    // return ((hexToDecimal(hex1) - hexToDecimal(hex2)));
    return hex1 - hex2;
}

function calculateLength(startingAdd, objStartAdd, objAttributes) {
    startingAdd = Number(startingAdd);
    objStartAdd = Number(objStartAdd);
    const diff = calculateDiff(objStartAdd, startingAdd);
    if (isDebug01) {
        log(startingAdd, objStartAdd);
        log(diff);
    }

    const readLength = 0;
    if (diff < 0) {
        if (isDebug01) {
            log('wrong paramter')
        }
        readLength = diff;
    } else if (diff === 0) {
        readLength = Number(objAttributes.length);
    } else {
        readLength = diff + Number(objAttributes.length);
    }
    return readLength;
}

function checkCondition(actual, expected, condition) {
    switch (condition) {
        case "eq":
            return actual == expected
        case "neq":
            return actual != expected
        case "lt":
            return actual < expected
        case "gt":
            return actual > expected
        case "lte":
            return actual <= expected
        case "gte":
            return actual >= expected
        default:
            return false
    }
}

function applyOffset(value, offset, operator) {
    //log('applyOffset ', value, ', ', offset, ' operator', operator);
    switch (operator) {
        case "plus":
            //log('performing addition $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$  ', value, ', ', offset, ' operator', operator);

            return Number(value) + Number(offset);
        case "minus":
            //log('performing minus $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$  ', value, ', ', offset, ' operator', operator);

            return Number(value) - Number(offset);
        default:
            return Number(value);
    }
}