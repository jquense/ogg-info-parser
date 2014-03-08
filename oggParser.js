var inherits = require('util').inherits
  , Tokenizr = require('stream-tokenizr')
  , VorbisStream = require('vorbis-parser')
  , binary = require('./binaryHelpers')
  , _ = require('lodash')
  , Long = require('long')
  , debug = require('debuglog')('oggparser');


module.exports = OggParser;

inherits(OggParser, Tokenizr);

function OggParser(){
    if ( !(this instanceof OggParser) ) 
        return new OggParser();

    Tokenizr.call(this, { objectMode: true })

    this.parsePages()
}


OggParser.prototype.parsePages = function(){
    var self = this
      , vorbis = new VorbisStream()
      , syncWord = new Buffer('OggS')
      , start, sample;

    vorbis
        .on('data', function(tag){
            if ( tag.type === "sampleRate" ) sample = tag.value
            self.push(tag)
        })
        .on('error', function(err){
            if ( !(err.message === 'not a valid vorbis Stream' && this.readCommentHeader === true))
                throw err;
        })

    this.loop(function(end){
 
        this.isEqual(syncWord, 'not a valid ogg file')
            .readBuffer(23,         this.parsePageHeader)
            .readBuffer('segments', this.parsePageLength)
            .tap(function(tok){
                var header = tok.header
                  , page = header.pageSeq

                //console.log(page)

                if ( header.bos ) start = header.granulePos;
                else if ( header.eos ) {
                    this.push({ type: 'duration', value: OggParser.getDuration(start, header.granulePos, sample) })

                    this.push( null );
                    return end();
                }
                
                if ( page <= 1 ) {
                    this.readBuffer(tok.pageLen, function(b){
                        vorbis[page == 1 ? 'end' : 'write'](b)   
                    })
                } else {
                    this.skip(tok.pageLen)    
                }
            })
            .flush()
    })
}


OggParser.prototype.parsePageHeader = function(buf, tokens){
    var pos = binary.readUInt64LE(buf, 2)
      , header = {
            version: buf[0],
            continuation: binary.getBit(buf, 1, 0),
            bos: binary.getBit(buf, 1, 1),
            eos: binary.getBit(buf, 1, 2),
            granulePos: pos, // returns Long class
            serial:  buf.readUInt32LE(10),
            pageSeq: buf.readUInt32LE(14),
            checkSum:  buf.readUInt32LE(18),
            segments: buf[22]
        }

    //if ( buf[1] !== 0x01 &&  buf[1] !== 0x03 && buf[1] !== 0x04 )

    tokens.header = header;
    tokens.segments = header.segments
}

OggParser.prototype.parsePageLength = function(buf, tokens){
    tokens.last = buf[buf.length -1]
    tokens.pageLen = _.reduce(buf, function(s, i){
        return s += i;
    },0)
}


OggParser.getDuration = function(start, end, sample){
    var startIsLong, endIsLong;

    if ( start.high === 0 && end.high === 0 ) {
        start = start.toInt();
        end   = end.toInt();
    }

    startIsLong = start instanceof Long
    endIsLong   = end instanceof Long;

    if (!startIsLong && endIsLong ) start = Long.fromNumber(start, false), startIsLong = true;
    if (!endIsLong && startIsLong ) end = Long.fromNumber(end, false), endIsLong = true;


    return ( startIsLong && endIsLong ) 
        ? ( end.subtract(start) ).div(Long.fromNumber(sample, false) ).toNumber()
        : ( end - start ) / sample

    debug("arguments for getDuration were weird. start: %d, end: %d, sample: %d", start, end, sample)

    return 0;
}



