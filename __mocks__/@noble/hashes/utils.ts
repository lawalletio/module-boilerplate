const utils = jest.requireActual('@noble/hashes/utils');

utils.randomBytes = (size: number): Buffer => {
    return Buffer.alloc(size);
}

module.exports = utils;
