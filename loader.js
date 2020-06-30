// ************************ Drag and drop ***************** //
let dropArea = document.getElementById("drop-area")

// Prevent default drag behaviors
;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false)   
  document.body.addEventListener(eventName, preventDefaults, false)
})

// Highlight drop area when item is dragged over it
;['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false)
})

;['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false)
})

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false)

var fileName;
var showout = document.getElementById("showresult");
var re = /(?:\.([^.]+))?$/;

function preventDefaults (e) {
  e.preventDefault()
  e.stopPropagation()
}

function highlight(e) {
  dropArea.classList.add('highlight')
}

function unhighlight(e) {
  dropArea.classList.remove('active')
}

function handleDrop(e) {
  var dt = e.dataTransfer
  var files = dt.files

  handleFiles(files)
}

let uploadProgress = []
let progressBar = document.getElementById('progress-bar')

function initializeProgress(numFiles) {
  progressBar.value = 0
  uploadProgress = []

  for(let i = numFiles; i > 0; i--) {
    uploadProgress.push(0)
  }
}

function updateProgress(fileNumber, percent) {
  uploadProgress[fileNumber] = percent
  let total = uploadProgress.reduce((tot, curr) => tot + curr, 0) / uploadProgress.length
  console.debug('update', fileNumber, percent, total)
  progressBar.value = total
}

function handleFiles(files) {
  files = [...files]
  initializeProgress(files.length)
  files.forEach(readFile)
  //files.forEach(previewFile)
}

function previewFile(file) {
  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = function() {
    let img = document.createElement('img')
    img.src = reader.result
    document.getElementById('gallery').appendChild(img)
  }
}

function readImage(file) {
  // Check if the file is an image.
  if (file.type && file.type.indexOf('image') === -1) {
    console.log('File is not an image.', file.type, file);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    img.src = event.target.result;
  });
  reader.readAsDataURL(file);
}

function CSVToArray( strData, strDelimiter ){
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			strMatchedDelimiter !== strDelimiter
			){

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push( [] );

		}

		var strMatchedValue;

		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[ 2 ]){

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			strMatchedValue = arrMatches[ 3 ];

		}


		// Now that we have our value string, let's add
		// it to the data array.
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}

	// Return the parsed data.
	return( arrData );
}

function convertEurobank(filecontent){
	let string = "Posting Date,Value Date,UTN,Description,Payee,Debit_Credit,Balance\r\n";
	var lines = filecontent.split('"\n"');
    for(var line = 1; line < lines.length; line++){
		linestr = lines[line];
		//linestr = linestr.substring(1, linestr.length - 1);
		var columns = linestr.split('","');
		
		// check lines without data
		if(columns.length == 1){
			continue;
		}
		
		columns[3] = columns[3].replace("Purchase  ", "");
		columns[3] = columns[3].replace("Handling Fee  ", "");
		columns[3] = columns[3].replace("- - Web Ref", "");
		columns[3] = columns[3].replace(" - Web Ref", "");
		columns[3] = columns[3].replace("F/O: ", "");
		columns[3] = columns[3].replace(" /Loan agreement from UBO", "");
		
		var description = columns[3].split(' - ')[0];
		var payee = '';
		if(columns[3].split(' - ').length > 1){
			payee = columns[3].split(' - ')[1];
		}
		
		// save text only before "for card"
		if(payee.split('for card').length > 1){
			payee = payee.split('for card')[0];
			payee = payee.trim();
		}
		
		// if "SWIFT" and more than one line then save only second line
		if((payee.indexOf("SWIFT") > -1) && (payee.indexOf("\n") > -1)){
			payee = payee.split('\n')[1].trim();
		}
		
		// if begin from "for " then then save text after "for "
		if(payee.indexOf("for ") == 0){
			payee = payee.split('for ')[1].trim();
		}
		
		//del all eols
		payee = payee.replace("\n", " ");
		payee = payee.replace("\r", " ");
		
		// del '"' in last line of file
		if(columns[6].indexOf('"') == columns[6].length - 2){
			columns[6] = columns[6].substring(0, columns[6].length-2);
		}
		
		string += columns[0] + ","    						//Posting Date
					+ columns[1] + ","						//Value Date
					+ columns[2] + "," 						//UTN
					+ description + ","						//Description
					+ payee + ","							//Payee
					+ (columns[4] == "0.00" ? columns[5] : "-" + columns[4]) + ","	 // Debit_Credit
					+ columns[6]+ "\r\n";					//Balance
		 
      //string += '\n';
    }
	return string;
}

function convertFIBank(filecontent){
	let string = "reference,datetime,valuedate,debit_credit,trname,contragent,rem_i,rem_ii,rem_iii\r\n";
	var lines = filecontent.split('\r\n');
    for(var line = 1; line < lines.length; line++){
		linestr = lines[line];
		//linestr = linestr.substring(1, linestr.length - 1);
		var columns = linestr.split(',');
		
		// check lines without data
		if(columns.length == 1){
			continue;
		}
		
		// cut time when exists
		columns[1] = columns[1].split(' - ')[0];
		columns[2] = columns[2].split(' - ')[0];
		
		// add 0 when first symbol is dot
		var debit_credit = (columns[3] == "" ? columns[4]:columns[3]);
		if(debit_credit.indexOf(".") == 0){
			debit_credit = "0" + debit_credit;
		} 
		
		if(columns[4] == ""){
			debit_credit = "-" + debit_credit;
		}
		
		
		string += columns[0] + ","    						//reference
					+ columns[1] + ","						//datetime
					+ columns[2] + "," 						//valuedate
					+ debit_credit + ","	 				// debit_credit
					+ columns[5] + ","						//trname
					+ columns[6] + ","						//contragent
					+ columns[7] + ","						//rem_i
					+ columns[8] + ","						//rem_ii
					+ columns[9]+ "\r\n";					//rem_iii
		 
      //string += '\n';
    }
	return string;
}

function convertHellenic(filecontent){
	let string = "ACCOUNT NO,PERIOD,CURRENCY,DATE,DESCRIPTION,PAYEE,DEBIT_CREDIT,VALUE DATE,BALANCE\r\n";
	console.log(filecontent);
	var lines = filecontent.split('\n');
    for(var line = 1; line < lines.length; line++){
		linestr = lines[line];
		//linestr = linestr.replace('"', '');
		
		var columns = linestr.split(',');
		
		// check lines without data
		if(columns.length == 1){
			continue;
		}
		
		var array = CSVToArray(linestr, ",");
		
		
		var description = array[0][4].split(' ')[0];
		var payee = array[0][4].substring(description.length+1, array[0][4].length).trim();
		var debit_credit = (array[0][5] == "0.00" ? array[0][6] : "-" + array[0][5])
		
		// delete "," in DEBIT_CREDIT
		debit_credit = debit_credit.replace(',', '');
		
		// delete ".", and replace "," into "." in BALANCE
		array[0][8] = array[0][8].replace('.', '').replace(',', '.').trim();
		
		string += array[0][0] + ","    						//ACCOUNT NO
					+ array[0][1] + ","						//PERIOD
					+ array[0][2] + "," 					//CURRENCY
					+ array[0][3] + "," 					//DATE
					+ description + ","						//DESCRIPTION
					+ payee + ","							//PAYEE
					+ debit_credit + ","					//DEBIT_CREDIT 
					+ array[0][7] + ","						//VALUE DATE
					+ array[0][8] + "\r\n";					//BALANCE
		 
      //string += '\n';
    }
	return string;
}

function readFile(file) {
  const reader = new FileReader();
  const ext = re.exec(file.name)[1];
  
  reader.addEventListener('load', (event) => {
    var result = event.target.result;
	
	

	
	//showout.innerHTML  = result; 
	fileName = file.name;
	
	if (ext.toLowerCase() == "xls"){
        var cfb = XLSX.read(event.target.result, {type: 'binary'});
        result = XLS.utils.make_csv(cfb.Sheets[cfb.SheetNames[0]]);   
	}
	var today = new Date();
	var date = today.getFullYear() + String((today.getMonth()+1)).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
	var time = +String(today.getHours()).padStart(2, '0')  + String(today.getMinutes()).padStart(2, '0')  + String(today.getSeconds()).padStart(2, '0');
	var dateTime = date+time;
	
	fileName = file.name.slice(0,file.name.length - ext.length -1) + '_converted_at_' + dateTime + '.csv';
	
	var string = "";
	// chekBankSignature
	if(result.split('\n')[0] == '"Posting Date","Value Date","UTN","Description","Debit","Credit","Balance"'){
		string = convertEurobank(result);//"Posting Date,Value Date,UTN,Description,Payee,Debit_Credit,Balance\n";
	}else if(result.split('\n')[0] == 'reference,datetime,valuedate,debit,credit,trname,contragent,rem_i,rem_ii,rem_iii\r'){
		string = convertFIBank(result);
	}else if((ext == "xls")&&(result.split('\n')[0] == 'ACCOUNT NO,PERIOD,CURRENCY,DATE,DESCRIPTION,DEBIT,CREDIT,VALUE DATE,BALANCE')){
		//alert(firstXLSLine);
		string = convertHellenic(result);//"Posting Date,Value Date,UTN,Description,Payee,Debit_Credit,Balance\n";
	}else{
		showout.innerHTML  = "Do not recognize the bank";
		return;
	}
	
    console.log (string);
    var blob = new Blob([string], {
        type: "data:text/plain;charset=utf-8"
    });
	
    
    saveAs(blob, fileName);
	date = today.getFullYear()+'.'+String((today.getMonth()+1)).padStart(2, '0')+'.'+String(today.getDate()).padStart(2, '0');
	time = today.getHours() + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2, '0');
	dateTime = date+" "+time;
	showout.innerHTML  = fileName + " successfully converted at " + dateTime; 
  });

  reader.addEventListener('progress', (event) => {
    if (event.loaded && event.total) {
      const percent = (event.loaded / event.total) * 100;
      console.log(`Progress: ${Math.round(percent)}`);
    }
  });
  
  reader.addEventListener('error', (event) => {
      //console.log(reader.error);
	  showout.innerHTML  = reader.error; 
    });
  if ((ext.toLowerCase() == "xls")||(ext.toLowerCase() == "xlsx")){
	reader.readAsBinaryString(file);  
  }	else{
	reader.readAsText(file);  
  }
  
}

function doSave() {
    var filename = prompt("File name? ", "data.txt");
    var data = {
        temp: 36.5,
        humidity: 85.4
    };
    var string = JSON.stringify (data);
    console.log (string);
    var blob = new Blob([string], {
        type: "text/plain;charset=utf-8"
    });
    
    saveAs(blob, filename);
}