const isDebug = DEBUG_LOG.SS_NORMALIZER;
var convertToDataType = {};
convertToDataType[dataType['32Float']] = function (rawData) {
  var arrayFloat = new Int16Array(rawData);
  var floats = new Float32Array(arrayFloat.buffer);
  return floats[0];
};

convertToDataType[dataType['32Integer']] = function (rawData) {
  var buffer = new ArrayBuffer(4);
  var bytes = new Uint16Array(buffer);
  // read the values sent from the server.
  bytes[0] = rawData[0];
  bytes[1] = rawData[1];

  var view = new DataView(buffer);
  //  Convert the bytes to HEX so they match the values in the HoldingRegisters app.
  //  DataView can get the value as a float.
  return view.getInt32(0, false);
};

convertToDataType[dataType['bit']] = function (rawData) {
  var buffer = new ArrayBuffer(1);
  var bytes = new Uint8Array(buffer);
  // read the values sent from the server.
  bytes[0] = rawData[0];
  var view = new DataView(buffer);
  return view.getInt8(0, false) == 1;
};

convertToDataType[dataType['boolean']] = function (rawData) {
  return rawData[0];
};

convertToDataType[dataType['byteStream']] = function (rawData) {
  var value = '';
  rawData.forEach(function (charCode) {
    value += String.fromCharCode(charCode);
  });
  return value;
};

convertToDataType[dataType['16Integer']] = function (rawData) {
  return rawData[0];
};

convertToDataType[dataType['u16Integer']] = function (rawData) {
  var buffer = new ArrayBuffer(2);
  var bytes = new Uint16Array(buffer);
  // read the values sent from the server.
  bytes[0] = rawData[0];

  var view = new DataView(buffer);
  //  Convert the bytes to HEX so they match the values in the HoldingRegisters app.
  //  DataView can get the value as a float.
  return view.getInt16(0, false);
};

convertToDataType[dataType['enum']] = function (rawData, objectInfo) {
  var value = rawData[0];
  if (isDebug) {
    log('Object enum: ', objectInfo.enum);
    log('value : ' + value);
  }

  if (!objectInfo || isEmptyArray(objectInfo.enum) || isNaN(value)) {
    if (isDebug) {
      log('!! Invalid enum !!');
    }
    return value;
  }

  var result;
  objectInfo.enum.forEach(function (enumObj) {
    if (enumObj.value == value) result = enumObj;
  });

  if (!result) {
    if (isDebug) {
      log('Enum doesnt have matching entry for value ' + value);
    }
    return value;
  }
  if (isDebug) {
    log('result : ', result);
  }
  return result.text;
};

convertToDataType[dataType['mask']] = function (rawData, objectInfo) {
  const bitMask = objectInfo['bitMask'];
  const bitMaskDecimal = parseInt(bitMask, 2);
  const valueDecimal = rawData[0];
  log('bitMaskDecimal', bitMaskDecimal);
  log('valueDecimal', valueDecimal);
  log('(valueDecimal & bitMaskDecimal)', valueDecimal & bitMaskDecimal);
  return (valueDecimal & bitMaskDecimal) == bitMaskDecimal;
};

/**
 * - Convert modbus value based on register data type to get actual value
 * - Apply configured modifier(roundto, multiplier etc) on actual value
 */
function getNormalizedValue(modbusValueArray, objectInfo) {
  if (isDebug) {
    log('In getNormalizedValue:  modbusValueArray = ', modbusValueArray);
    logStdErr('In getNormalizedValue:  modbusValueArray = ', modbusValueArray);
  }

  var objType = objectInfo.dataType;
  if (isDebug) {
    log('objectInfo:  ', objectInfo);
    logStdErr('objectInfo:  ', objectInfo);
  }

  if (!convertToDataType.hasOwnProperty(objType)) {
    if (isDebug) {
      log('getNormalizedValue:  Data type not supported: ' + objType + ' returning -1');
      logStdErr('getNormalizedValue:  Data type not supported: ' + objType + ' returning -1');
      log(convertToDataType[objType](modbusValueArray));
    }
    return ELIMINATE_REGISTER;
  }

  //Convert modbus value based on register data type to get actual value
  var value = convertToDataType[objType](modbusValueArray, objectInfo);

  if (isDebug) {
    log('CONVERSION TO TYPE:  ', modbusValueArray, ' converted to:  ', value);
  }

  const objectInfoKeys = Object.keys(objectInfo);

  const modifiersInOrder = Object.keys(modifiers);
  if (isDebug) {
    log('Processing modifier:  ', modifiersInOrder);
    logStdErr('Processing modifier:  ', modifiersInOrder);
  }
  // if (isDebug) {
  //     //log('modifiersInOrder: +>+>+>+>+>+>+>+>+>+>+>+>+>+>+  ', modifiersInOrder)
  // }
  // if ((objectInfoKeys.indexOf(modifiers.multiplier) >= 0)) {
  //     value = processModifier[modifiers.multiplier](value, objectInfo);
  // }
  // if ((objectInfoKeys.indexOf(modifiers.offset) >= 0)) {
  //     value = processModifier[modifiers.offset](value, objectInfo);
  // }
  // if ((objectInfoKeys.indexOf(modifiers.roundTo) >= 0)) {
  //     value = processModifier[modifiers.roundTo](value, objectInfo);
  // }

  // Nidhish's Impl, If not work then uncomment above and comment this
  //Apply configured modifier(roundto, multiplier etc) on actual value
  modifiersInOrder.forEach(function (modifier) {
    if (objectInfoKeys.indexOf(modifier) < 0) {
      return;
    }

    value = processModifier[modifier](value, objectInfo);
    if (isDebug) {
      log('modifier: ', modifier, ' value: ', value);
    }
  });

  if (isDebug) {
    log('getNormalizedValue returning: ' + value);
    logStdErr('getNormalizedValue returning: ' + value);
  }
  return value;
}
/**
 *  ================  WRITE UTILITIES ===============
 */

var convertWriteValToDataType = {};
convertWriteValToDataType[dataType['32Float']] = function (value) {
  return Number(value);
};

convertWriteValToDataType[dataType['32Integer']] = function (value) {
  return Number(value);
};

convertWriteValToDataType[dataType['bit']] = function (value) {
  return value;
};

convertWriteValToDataType[dataType['boolean']] = function (value) {
  if (value === true || value == 1 || (typeof myVar === 'string' && value.trim().toLowerCase() === 'true')) return true;
  else return false;
};

convertWriteValToDataType[dataType['byteStream']] = function (value) {
  return value;
};

convertWriteValToDataType[dataType['16Integer']] = function (value) {
  return Number(value);
};

convertWriteValToDataType[dataType['u16Integer']] = function (value) {
  return Number(value);
};

convertWriteValToDataType[dataType['enum']] = function (value) {
  return Number(value);
};

function getWriteNormalizedValue(writeParams, registerConfig) {
  //log('In getWriteNormalizedValue:  writeParams = ', writeParams);
  //logStdErr('In getWriteNormalizedValue:  writeParams = ', writeParams);
  writeParams.value = convertWriteValToDataType[registerConfig.dataType](writeParams.value);
  const objectInfoKeys = Object.keys(writeParams);
  var value = writeParams.value;
  const modifiersInOrder = Object.keys(writeModifiers);
  //log('modifiersInOrder: +>+>+>+>+>+>+>+>+>+>+>+>+>+>+  ', modifiersInOrder)

  // Bill's impl BUT below(Nidhish's) implementation does the same with more dynamic way so commenting it for now
  // if ((objectInfoKeys.indexOf(modifiers.offset) >= 0)) {
  //     value = processWriteModifier[modifiers.offset](value, writeParams);
  // }
  // if ((objectInfoKeys.indexOf(modifiers.multiplier) >= 0)) {
  //     value = processWriteModifier[modifiers.multiplier](value, writeParams);
  // }
  // if ((objectInfoKeys.indexOf(modifiers.roundTo) >= 0)) {
  //     value = processWriteModifier[modifiers.roundTo](value, writeParams);
  // }

  // Nidhish's Impl, If not work then uncomment above and comment this
  modifiersInOrder.forEach(function (modifier) {
    if (objectInfoKeys.indexOf(modifier) < 0) {
      return;
    }
    //log("getWriteNormalizedValue setting value= " + value);
    //logStdErr("getWriteNormalizedValue setting value= " + value);
    value = processWriteModifier[modifier](value, writeParams);
  });

  //log("getWriteNormalizedValue returning: " + value);
  //logStdErr("getWriteNormalizedValue returning: " + value);
  return value;
}

const processModifier = {};
processModifier[modifiers.roundTo] = function roundTo(value, objectInfo) {
  //log('processModifier ', modifiers.roundTo, ' value: ', value, ' objectInfo:  ', objectInfo);
  //logStdErr('processModifier ', modifiers.roundTo, ' value: ', value, ' objectInfo:  ', objectInfo);
  const roundTo = objectInfo[modifiers.roundTo];
  return parseFloat(Number(value)).toFixed(Number(roundTo));
};

processModifier[modifiers.multiplier] = function multiplier(value, objectInfo) {
  //log('processModifier ', modifiers.multiplier, ' value: ', value, ' objectInfo:  ', objectInfo);
  //logStdErr('processModifier ', modifiers.multiplier, ' value: ', value, ' objectInfo:  ', objectInfo);
  const multiplier = objectInfo[modifiers.multiplier];
  return Number(value) * Number(multiplier);
};

processModifier[modifiers.offset] = function multiplier(value, objectInfo) {
  //log('$$$$$. processModifier ', modifiers.offset, ' value: ', value, ' objectInfo:  ', objectInfo);
  //logStdErr('$$$$$. processModifier ', modifiers.offset, ' value: ', value, ' objectInfo:  ', objectInfo);
  const offset = objectInfo[modifiers.offset];
  const operator = objectInfo['multipleAndOffsetOperator'];
  const result = applyOffset(value, offset, operator);
  return result;
};

const processWriteModifier = {};
processWriteModifier[writeModifiers.roundTo] = function roundTo(value, objectInfo) {
  //log('processWriteModifier ', writeModifiers.roundTo, ' value: ', value, ' objectInfo:  ', objectInfo);
  //logStdErr('processWriteModifier ', writeModifiers.roundTo, ' value: ', value, ' objectInfo:  ', objectInfo);

  const roundTo = objectInfo[writeModifiers.roundTo];
  return parseFloat(value).toFixed(roundTo);
};

processWriteModifier[writeModifiers.multiplier] = function multiplier(value, objectInfo) {
  //log('processWriteModifier ', writeModifiers.multiplier, ' value: ', value, ' objectInfo:  ', objectInfo);
  //logStdErr('processWriteModifier ', writeModifiers.multiplier, ' value: ', value, ' objectInfo:  ', objectInfo);

  const multiplier = objectInfo[writeModifiers.multiplier];
  return Number(value) * Number(multiplier);
};

processWriteModifier[writeModifiers.offset] = function multiplier(value, objectInfo) {
  //log('processWriteModifier ', writeModifiers.offset, ' value: ', value, ' objectInfo:  ', objectInfo);
  //logStdErr('processWriteModifier ', writeModifiers.offset, ' value: ', value, ' objectInfo:  ', objectInfo);
  const offset = objectInfo[writeModifiers.offset];
  const operator = objectInfo['multipleAndOffsetOperator'];
  const result = applyOffset(value, offset, operator);
  return result;
};

function getFilterTypeFromObjectInfo(objectInfo) {
  const filters = Object.keys(filter);
  const objectKeys = Object.keys(objectInfo);
}

/**
 *  Apply filter processDeltaOnly or minUpdate and based on it's result
 *  eliminate or approve register to send downstream
 */
function applyFilter(params) {
  if (isDebug) {
    log('>>>> Aply filter');
  }
  return new Promise(function (fulfill, rej) {
    const objectInfo = params.objectInfo;
    const asset = params.asset;
    const value = objectInfo.value;
    objectInfo.assetId = asset.id;
    objectInfo.assetType = asset.type;
    const filterKeys = Object.keys(filter);
    const objectKeys = Object.keys(objectInfo);
    const filterResults = filterKeys
      .filter(function (filterkey) {
        return objectInfo.hasOwnProperty(filterkey) && objectInfo[filterkey] != 0;
      })
      .map(function (filterKey) {
        return processFilter[filterKey](objectInfo, asset);
      });

    Promise.all(filterResults)
      .then(function (result) {
        if (isDebug) {
          log(result);
        }
        const hasEliminatereReg = result.length > 0 && result.indexOf(ELIMINATE_REGISTER) >= 0;
        objectInfo.value = hasEliminatereReg ? ELIMINATE_REGISTER : value;
        fulfill(objectInfo);
      })
      .catch(function (err) {
        objectInfo.value = ELIMINATE_REGISTER;
        fulfill(objectInfo);
      });
  });
}
const processFilter = {};
/**
 * Consider/send value change only if change/delta(current value-previous value)
 * is greater or less then 'deltaGTAndLT' value configured in register config
 */
processFilter[filter.processDeltaOnly] = function (objectInfo, asset) {
  if (isDebug) {
    log('>>>>>>>filter.processDeltaOnly');
  }
  return new Promise(function (fulfill, rej) {
    const isProcessDeltaOnly = objectInfo[filter.processDeltaOnly];
    if (isDebug) {
      log('isProcessDeltaOnly: ', isProcessDeltaOnly);
    }
    if (!isProcessDeltaOnly) fulfill(APPROVE_REGISTER);
    if (isDebug) {
      log('objectInfo', objectInfo);
    }
    const value = objectInfo.value;
    const key = asset.id + '_' + objectInfo.attribute_name;
    const cacheParams = {
      cache_name: CACHE.ASSET_PREVIOUS_VALUE,
      key
    };
    function updateCacheData() {
      cacheParams.data = value;
      setValueForCache(cacheParams, function (err, data) {
        if (isDebug) {
          log('Ading value in cache for params : ' + JSON.stringify(cacheParams));
        }
      });
    }
    function getValueByKeyForCacheCB(err, cData) {
      if (isDebug) {
        log('---------');
        log(value);
        log(cData);
        log('---------');
      }
      var result = ELIMINATE_REGISTER;
      if (err) {
        if (isDebug) {
          log('Error while getting cache data for params ' + JSON.stringify(cacheParams));
          log('ERROR: ' + err);
        }
        result = APPROVE_REGISTER;
      }
      if (isEmptyOrNullVal(cData)) {
        if (isDebug) {
          log('No data or not a valid number in cache for params ' + JSON.stringify(cacheParams));
        }
        result = APPROVE_REGISTER;
        updateCacheData();
      } else if (value !== cData) {
        result = APPROVE_REGISTER;
        const delta = value - cData;
        log(delta);
        const deltaGreaterThan = Number(objectInfo.deltaG);
        const deltaLessThan = Number(objectInfo.deltaL);
        const deltaGTAndLT = Number(objectInfo.deltaE);
        log(deltaGreaterThan + ' : ' + deltaLessThan + ' : ' + deltaGTAndLT);
        if (deltaGreaterThan && isValidNumber(deltaGreaterThan) && delta <= deltaGreaterThan) {
          result = ELIMINATE_REGISTER;
        }
        if (deltaLessThan && isValidNumber(deltaLessThan) && delta >= deltaLessThan) {
          result = ELIMINATE_REGISTER;
        }

        if (deltaGTAndLT && isValidNumber(deltaGTAndLT) && (delta >= deltaGTAndLT || delta <= deltaGTAndLT)) {
          const eliminateReg = delta >= 0 ? delta <= deltaGTAndLT : delta >= -deltaGTAndLT;
          result = eliminateReg ? ELIMINATE_REGISTER : APPROVE_REGISTER;
          if (isDebug) {
            log('Result eliminateReg', result);
          }
        }
        updateCacheData();
      }
      fulfill(result);
    }
    getValueByKeyForCache(cacheParams, getValueByKeyForCacheCB);
  });
};

/**
 * Consider/send value only if current value is diffrent then previous value and last update time exceed 'minUpdate' in second
 */
processFilter[filter.minUpdate] = function (objectInfo, asset) {
  if (isDebug) {
    log('>>>>>>>filter.minUpdate');
  }
  return new Promise(function (fulfill, rej) {
    const minUpdate = objectInfo[filter.minUpdate];
    const value = objectInfo.value;
    const key = asset.id + '_' + objectInfo.address;
    const cacheParams = {
      cache_name: CACHE.ASSET_PREVIOUS_LAST_UPDATE,
      key
    };
    function updateCacheData() {
      cacheParams.data = {
        time: new Date(),
        value
      };
      setValueForCache(cacheParams, function (err, data) {
        if (isDebug) {
          log('Ading value in cache for params : ' + JSON.stringify(cacheParams));
        }
      });
    }
    function getValueByKeyForCacheCB(err, cData) {
      if (isDebug) {
        log('---------');
        log('minUpdate Cache data, error: ', cData, err);
        log('---------');
      }
      var result = ELIMINATE_REGISTER;
      if (err) {
        if (isDebug) {
          log('Error while getting cache data for params ' + JSON.stringify(cacheParams));
          log('ERROR: ' + err);
        }
        result = APPROVE_REGISTER;
      }
      if (!cData || !cData.value || isEmptyString(cData.time)) {
        if (isDebug) {
          log('No data or not a valid number in cache for params ' + JSON.stringify(cacheParams));
        }
        updateCacheData();
        result = APPROVE_REGISTER;
      } else if (value !== cData.value) {
        const diff = new Date() - new Date(cData.time);
        const diffInSecond = Math.round(diff / 1000);
        if (diffInSecond >= minUpdate) result = APPROVE_REGISTER;
        updateCacheData();
      }
      if (isDebug) {
        log('minUpdate result of ' + objectInfo.address + ': ', result);
      }
      fulfill(result);
    }
    getValueByKeyForCache(cacheParams, getValueByKeyForCacheCB);
  });
};
