var chai = require('chai')
  , Parser = require('../oggParser')
  , Long = require('long');

chai.should()

describe('when parsing an Ogg Stream', function(){
    var parser, tags;

    beforeEach(function(){
        tags = {};
        parser = new Parser();
    })


    it('should calculate Duration properly with 64ints', function(){
        Parser.getDuration(20, 120, 50 ).should.equal(2)

        Parser.getDuration(20, new Long(120, 0, true), 50 ).should.equal(2)
        Parser.getDuration(new Long(20, 0, true), 120, 50 ).should.equal(2)
        Parser.getDuration(new Long(20, 0, true), new Long(120, 0, true), 50 ).should.equal(2)

        Parser.getDuration(0, new Long(0, 16777216, true), 80000 ).should.equal(900719925474)
    });

    it('should calculate page length correctly', function(){
        var tokens = {}
        parser.parsePageLength(new Buffer([10,15,20,25,30]), tokens);

        tokens.pageLen.should.equal(100)
    });

    it('should parse the comments correctly', function(done){

        require('fs' ).createReadStream('./tests/vorbis.ogg')
            .pipe(parser)

        parser
            .on('data', function(t){
                tags[t.type] = t.value;
            })
            .on('end', function(){
                tags.should.have.property('duration' ).that.is.closeTo(10, 0.1)

                tags.should.have.property('version' ).that.equals(0)
                tags.should.have.property('channels' ).that.equals(1)
                tags.should.have.property('sampleRate' ).that.equals(44100)
                tags.should.have.property('bitRateMax' ).that.equals(0)
                tags.should.have.property('bitRateNominal' ).that.equals(80000)
                tags.should.have.property('bitRateMin' ).that.equals(0)

                tags.should.have.property('TITLE' ).that.equals('Silent MP3 10 Seconds')
                tags.should.have.property('ALBUM' ).that.equals('my album')
                tags.should.have.property('ARTIST' ).that.equals('an artist')
                tags.should.have.property('GENRE' ).that.equals('Christian Gangsta Rap')
                tags.should.have.property('TRACKNUMBER' ).that.equals('1')

                tags.should.have.property('METADATA_BLOCK_PICTURE' )
                tags.should.have.deep.property('METADATA_BLOCK_PICTURE.mime' ).that.equals('image/png')
                tags.should.have.deep.property('METADATA_BLOCK_PICTURE.desc' ).that.equals('')
                tags.should.have.deep.property('METADATA_BLOCK_PICTURE.data.length' ).that.equals(23867)

                done()
            })
    })

    describe('when parsing the header', function(){
        var tokens;
        beforeEach(function(){
            tokens = {};
            header = new Buffer([0,
                /* flags */    0x02,
                /* pos */      0,0,0,0, 0,0,0,0x01,
                /* serial */   0,0,0,20, // 335544320
                /* pageNum */  0,0,0,20, // 335544320
                /* chkSum */   1,0,0,0,
                /* segments */ 95])
        })

        it('should parse continuation flag correctly', function(){
            header[1] = 0x01;
            parser.parsePageHeader(header, tokens);

            tokens.header.continuation.should.be.true
            tokens.header.bos.should.be.false
            tokens.header.eos.should.be.false
        });

        it('should parse bos flag correctly', function(){
            header[1] = 0x02;
            parser.parsePageHeader(header, tokens);

            tokens.header.continuation.should.be.false
            tokens.header.bos.should.be.true
            tokens.header.eos.should.be.false
        });

        it('should parse eos flag correctly', function(){
            header[1] = 0x04;
            parser.parsePageHeader(header, tokens);

            tokens.header.continuation.should.be.false
            tokens.header.bos.should.be.false
            tokens.header.eos.should.be.true
        });


        it('should parse 64bit int correctly', function(){
            var pos;
            parser.parsePageHeader(header, tokens);

            pos = tokens.header.granulePos;

            pos.high.should.equal(16777216)
            pos.low.should.equal(0)
            pos.toString(10).should.equal('72057594037927936')
        });

        it('should parse serial, seqNo, checksum and segments', function(){
            parser.parsePageHeader(header, tokens);

            tokens.should.have.deep.property('header.serial' ).that.equals(335544320)
            tokens.should.have.deep.property('header.pageSeq' ).that.equals(335544320)
            tokens.should.have.deep.property('header.checkSum' ).that.equals(1)
            tokens.should.have.deep.property('header.segments' ).that.equals(95)
        });
    })
})


