const DB = {
    adapterConfig: 'adapter_config',
    assets: 'assets',
    edgeAssetMappings: 'edge_asset_mappings'
}

const adapterType = {
    modbus: 'modbus'
}

const DEBUG_LOG = {
    SS_PROCESS_MODBUS_CONFIG: false,
    SS_BULK_READ_REGISTER: false,
    SS_NORMALIZER: false,
    SS_PERFORM_ACTION: false,
    SS_MODUBS_RTU_RESPONSE: false,
}
const topics = {
    bulkReadRegisters: 'bulk/readRegister',
    requestNormalizer: 'normalizer/request',
    normalizerFail: 'error/normalizer',    
    EDGE_TO_ASSET: '_dbupdate/_monitor/_asset/%s/status',
    EDGE_TO_HISTORY: '_history/_monitor/_asset/%s',
    EDGE_TO_LIVE: 'live/monitor/asset/%s/locationAndStatus/_platform',
    TO_EDGE: 'commandEvent/_edge/%s',
    ACTION_TO_ASSET: '_monitor/asset/default/data/_platform',
    ASSET_ACTION_TO_CLOUD: '_dbupdate/_monitor/_asset/+/command/+/request',
    COMMAND_TO_EDGE: 'commandEvent/_edge/%s',
    MODBUS_RTU_READ_WRITE_REQUEST: 'modbus/command/request',
    MODBUS_RTU_RESPONSE: 'modbus/command/response',
    TRIGGER_ADAPTER_CONFIG: 'trigger/adapter_config',
    SYNC_UPDATE_ASSET: 'sync/update/asset'
}

const MODBUS_OPERATION = ['read', 'write'];

// TODO need to replace this config by registerType json below
const register = {
    readHoldingReg: 'readHoldingRegister',
    readCoilReg: 'coils',
    readInputReg: 'inputRegister',
    // readDiscreteInputsReg: 'readDiscreteInputs'
    readDiscreteInputsReg: 'discreteInputReg'
}

const registerType = {
    holdingRegister: 'holdingRegister',
    coilRegister: 'coilRegister',
    inputRegister: 'inputRegister',
    discreteInputsRegister: 'discreteInputsRegister',
    register: 'register'
}


const modbusRTURegister = {};
modbusRTURegister[registerType.coilRegister] = 1;
modbusRTURegister[registerType.discreteInputsRegister] = 2;
modbusRTURegister[registerType.holdingRegister] = 3;
modbusRTURegister[registerType.inputRegister] = 4;

const modbusRTUWriteRegister = {};
modbusRTUWriteRegister[registerType.coilRegister] = 5;
modbusRTUWriteRegister[registerType.holdingRegister] = 6;

const MODBUS_RTU_READ_WRITE_INITIATED = -1;  

const dataType = {
    '32Integer': '32Integer',
    'byteStream': 'byteStream',
    'flagMask': 'flagMask',
    '32Float': '32Float',
    'bit': 'bit',
    'boolean': 'boolean',
    '16Integer': '16Integer',
    'u16Integer': 'u16Integer',
    'enum': 'enum',
    'mask': 'mask'
}

const modifiers = {
    multiplier: 'multiplier',
    offset: "offset",    
    roundTo: 'roundTo',    
    // multipleAndOffsetOperator: 'multipleAndOffsetOperator'
}

const writeModifiers = {
    offset: "offset",
    multiplier: 'multiplier',    
    roundTo: 'roundTo',
    // multipleAndOffsetOperator: 'multipleAndOffsetOperator'
}

const filter = {
    processDeltaOnly: 'processDeltaOnly',
    minUpdate: 'minUpdate'
}

//CACHE NAME
const CACHE = {
    ASSET_PREVIOUS_VALUE: "assetPreviousValue",
    ASSET_PREVIOUS_LAST_UPDATE: "lastUpdate",
    ADAPTER_CONFIG: "adapterConfig",
    MODBUS_RTU_READ_STATE: "modbusRTUReadState",
    ASSETS: "assets"
}

const ELIMINATE_REGISTER = -1;
const APPROVE_REGISTER = 1;

const PRECONDITION_APPROVE = 1;
const PRECONDITION_REJECTED = -1;
