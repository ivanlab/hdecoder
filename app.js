// March 4 2017 -  Ivan Padilla
// HDLC Simple decoder - V. test


// need fs to retrieve files from file system and optimist to retrive comman line args

var fs = require('fs');
var argv = require('optimist').argv;

// capture line arguments: (f)rame-lenth, (t)imeslot-offset, timeslot-(l)ength, RAW file name

var frameLength = argv.f;
var timeslotOffset = argv.t;
var timeslotLength = argv.l;
var inputFile = argv._[0];

// check the TDM parameters are consistent

if (timeslotOffset+timeslotLength>frameLength-timeslotOffset){
    console.log('Wrong input parameters - Timeslot Length is too big');
    return;
}

// read RAW binary file to buffer

fs.stat(inputFile, function (error,stats) {
    fs.open(inputFile,"r", function (error,fd) {
        var tdm = new Buffer(stats.size);
        fs.read(fd,tdm,0,tdm.length,null,function (error,bytesRead,hdlc) {

            var tdmData = tdm.toString("hex",0,tdm.length);

            // extract HDLC message as text string from TDM stream

            var hdlcText="";

            for(var f = 1, len = tdmData.length; f < len ; f=f+2*frameLength){
                for (var i = 0;i<2*timeslotLength;i=i+2){
                    var pointer = f-1+2*timeslotOffset+i;
                    hdlcText=hdlcText+tdmData.substr(pointer,2);
                }

            }

            // Decode HDLC

            var decodedMessages = 0;
            var malformedMessages = 0;
            var outputFile = '';
            var currentMessage = '00000000 ';

            for (var i = 2; i<hdlcText.length-2;i=i+2) {

                if (hdlcText.substr(i-2,2) == '7e' && hdlcText.substr(i,2)!='7e' ){

                    do {
                        if (hdlcText.substr(i,2) == '7f' || hdlcText.substr(i,2) == 'fe'|| hdlcText.substr(i,2) == 'ff'){
                            malformedMessages++;
                        } else {
                            currentMessage = currentMessage + hdlcText.substr(i, 2) + ' ';
                        }
                        i = i + 2;

                    } while (hdlcText.substr(i,2)!='7e' && i<hdlcText.length-2);

                    outputFile=outputFile+currentMessage+'\n';
                    decodedMessages++;
                    var currentMessage = '00000000 ';

                }


            }

            console.log(outputFile);
            console.log('Decoded messages = ', decodedMessages);
            console.log('Malformed messages = ', malformedMessages);

        })

    })

})

