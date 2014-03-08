Ogg Audio File Metadata parser
=====================================

A simple streaming parser for retrieving  metadata from an .OGG file.

### Install

    npm install ogg-parser

### Use
The parser is simply a stream in objectMode, so you can pipe and binary data into it and it will spit out tag objects.

    var OGG = require('ogg-parser')
      , stream = require('fs').createReadStream('./my-file.ogg')

    var parser = stream.pipe(new OGG());

    parser.on('data', function(tag){
        console.log(tag.type)  // => 'bitRateNominal'
        console.log(tag.value) // => 128000
    })

### Tags

In addition to the normal [vorbis comments](http://xiph.org/vorbis/doc/v-comment.html) metadata the Ogg parser exposes additional
stream info

- `version`
- `sampleRate`
- `channels`
- `bitRateMax`
- `bitRateMin`
- `bitRateNominal`
- `duration`

consult the [vorbis parser](https://github.com/theporchrat/vorbis-info-parser) (used internally for comments)
documentation for more information