'use strict';
var Long = require('long')

exports.bufferEqual = function ( a, b ){
    if ( !Buffer.isBuffer(a) || !Buffer.isBuffer(b) ) return false 
    if ( a.length !== b.length ) return false 
    var i = 0;

    for(; i < a.length; ++i)
        if ( a[i] !== b[i] ) return false

    return true
}


exports.indexOf = function (buf, sub, fromIndex){
    var idx = fromIndex || 0
      , len = buf.length
      , chnkSize = sub.length;

    for (; idx < len; idx++ ){
        if ( exports.bufferEqual(buf.slice(idx, idx + chnkSize), sub) )
            return idx;    
    }

    return -1;
}



exports.getBit = function (n, off, pos){
    return !!(n[off] & (1 << pos));    
}

exports.readUInt24BE = function (buf, off) {
    return (((buf[off] << 8) + buf[off + 1]) << 8) + buf[off + 2];
}

exports.readUInt24LE = function (buf, off) {
    return (((buf[off + 2] << 8) + buf[off + 1]) << 8) + buf[off];
}

function tryGet64Bit(hi, low, signed){
    var trunc = hi & 0xFFF00000;

    if ( trunc !== 0 && ( !signed || trunc !== 0xFFF00000 ) ){
        throw new Error("64 bit int doesn't fit :/ ")    
    } 

    return ((hi & 0x001FFFFF) << 32) | low & 0xFFFFFFFF;
}

exports.readUInt64LE = function (buf, off, noAssert) {
    var hi  = buf.readInt32LE(off + 4, noAssert)
      , low = buf.readInt32LE(off, noAssert);

    return new Long(low, hi, true)
    //return tryGet64Bit(hi, low)
}

exports.readUInt64BE = function (buf, off, noAssert) {
    var hi  = buf.readInt32BE(off, noAssert)
      , low = buf.readInt32BE(off + 4, noAssert);

    return new Long(low, hi, true)
    //return tryGet64Bit(hi, low)
}

exports.syncSafe32Int = function (buf, off) {
    return buf[off + 3] & 0x7f | ((buf[off + 2]) << 7) | ((buf[off + 1]) << 14) | ((buf[off]) << 21);
}


exports.decodeString = function (buf, encoding, start, end) {
    start = start || 0;
    end   = end   || buf.length;

    if ( start > end)
        debugger;

    return encoding == 'utf16' 
        ? exports.toUtf16String( buf, start, end ) 
        : buf.toString( encoding == 'iso-8859-1' ? 'binary' : 'utf8', start, end );
}

exports.scan = function (buf, tok, encoding, start, end) {
    var i = start;

    if ( encoding === 'utf16' ) {
        while ( buf[i] !== tok || buf[i+1] !== tok ) {
            if (i >= end) return end;
            i++;
        }
    } else {
        while ( buf[i] !== tok ) {
            if (i >= end) return end;
            i++;
        }
    }
  return i;
}

exports.toUtf16String = function (buf, start, end) {
    start = start || 0
    end   = end   || buf.length

    if (buf[start] === 0xFE && buf[start + 1 ] === 0xFF) //BE the 16 bit chunks need to switch order (fake LE)
        buf = toBigEndian(buf.slice(start, end));
  
    return buf
        .toString('utf16le', start, end)
        .replace(/^\uFEFF/, '');
}

exports.toBigEndian = function (buff) {
  var len = buffer.length;

  if (len & 0x01) throw new Error('Buffer length must be even');
  
  for (var i = 0; i < len; i += 2) {
    var tmp = buff[i];

    buff[i] = buff[i + 1];
    buff[i + 1] = tmp;
  }
  return buff;
}

exports.find = function (buff, iter) {
    
}