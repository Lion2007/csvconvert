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


function handleFiles(files) {
  files = [...files]
  //initializeProgress(files.length)
  files.forEach(readFile)
  //files.forEach(previewFile)
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

function convertPaymentExecution(filecontent){
	let string = "Date,Transaction ID,Description,Payee,Description1,Debit/Credit,Current balance\r\n";
	//console.log(filecontent);
	var lines = filecontent.split('\n');
    for(var line = 4; line < lines.length; line++){
		linestr = lines[line];
		//linestr = linestr.replace('"', '');
		
		var columns = linestr.split(',');
		
		// check lines without data
		if(columns.length == 1){
			continue;
		}
		
		var array = CSVToArray(linestr, ",");
		
		// cut time when exists
		array[0][0] = array[0][0].split(' - ')[0];
		
		// del "," in numbers
		array[0][3] = array[0][3].replace(',', '');
		array[0][4] = array[0][4].replace(',', '');
		
		
		var description = "";
		var payee = "";
		var description1 = "";
		
		// rule 1
		if(array[0][2] == "Transfer FEE: OWT fee"){
			description = "Transfer FEE";
			description1 = "OWT fee";
		}
		
		// rule 2 start on Negative Interest Fee
		if(array[0][2].indexOf("Negative Interest Fee ") == 0){
			description = "Negative Interest Fee";
			description1 = array[0][2].split('Negative Interest Fee ')[1];
		}
		
		// rule 3 start on OWT/ 
		// from "OWT/ Invoice 2020-04 from 24.04.2020/ EUR 1,006.00 Yuliia Smalii Invoice 2020-04 from 24.04.2020 - TR 271725 - Return of Funds"
		// to Invoice 2020-04 from 24.04.2020,Yuliia Smalii,TR 271725 - Return of Funds 
		if(array[0][2].indexOf("OWT/ ") == 0){
			if(array[0][2].split('/ ').length >= 3){ 
				description = array[0][2].split('/ ')[1];
				// after next code-line "EUR 1,006.00 Yuliia Smalii  - TR 271725 - Return of Funds"
				payee = array[0][2].split('/ ')[2].replace(description,"");
				// after next code-line "1,006.00 Yuliia Smalii  - TR 271725 - Return of Funds"
				payee = payee.substring(4, payee.length);
				// after next code-line "Yuliia Smalii  - TR 271725 - Return of Funds"
				payee = payee.substring(payee.indexOf(" ")+1, payee.length);
				// divide by " - "
				if(payee.split(' - ').length > 1){
					description1 = payee.replace(payee.split(' - ')[0] + " - ","").trim()
				} 
				payee = payee.split(' - ')[0].trim();
			}
			else if(array[0][2].split('/ ').length == 2){ 
				// for lines like "OWT/ EUR 297.50 Prospectacy Ltd Invoice 2019CS2445"
				var tempstr = array[0][2].split('/ ')[1];
				if(tempstr.indexOf("Invoice") >= 0){
					payee = tempstr.substring(0, tempstr.indexOf("Invoice"));
					description = tempstr.substring(tempstr.indexOf("Invoice"), tempstr.length);
				} else{
					payee = tempstr;
					description = tempstr;
				}
				
				payee = payee.substring(4, payee.length);
				// after next code-line "Yuliia Smalii  - TR 271725 - Return of Funds"
				payee = payee.substring(payee.indexOf(" ")+1, payee.length);
				// divide by " - "
				if(payee.split(' - ').length > 1){
					description1 = payee.replace(payee.split(' - ')[0] + " - ","").trim()
				} 
				payee = payee.split(' - ')[0].trim();
			}
		}
		
		// rule 4 start on SEPA deposit
		if(array[0][2].indexOf("SEPA deposit") == 0){
			// description between Msg: and EndToEndId:
			description = array[0][2].substring(array[0][2].indexOf("Msg:") + 4,array[0][2].indexOf("EndToEndId:")).trim();
			// description1 include id: and numbers after EndToEndId:
			if(array[0][2].split('EndToEndId:').length > 1){
				description1 = array[0][2].split('EndToEndId:')[1];
				if(description1.indexOf("Id:") > -1){
					description1 = description1.substring(description1.indexOf("Id:"), description1.length);
				}else{
					description1 = "";
				}
			}
			// payee is the text between "SEPA deposit - from " and "BIC:"
			// SEPA deposit - from THE LUCK FACTORY EUROPE LIMITED BIC:
			payee = array[0][2].substring(0, array[0][2].indexOf("Msg:"));
			payee = payee.replace("SEPA deposit - from ", "");
			payee = payee.replace("SEPA deposit - ", "");
			if(payee.indexOf("BIC:") > -1){
				payee = payee.substring(0, payee.indexOf("BIC:"));
			}
			if(payee.indexOf("IBAN:") > -1){
				payee = payee.substring(0, payee.indexOf("IBAN:"));
			}
			
		}
		
		// rule 5 when description= "Own transfer between accounts" then description1 = description
		if(description == "Own transfer between accounts"){
			description1 = description;
		}
		
		
		
		string += array[0][0] + ","    						//Date
					+ array[0][1] + ","						//Transaction ID
					+ description + "," 					//Description
					+ payee + "," 							//Payee
					+ description1 + ","					//Description1
					+ array[0][3] + ","						//Debit/Credit
					+ array[0][4] + "\r\n";					//Current balance 
		 
      //string += '\n';
    }
	return string;
}

function convertEcommBX(filecontent){
	let string = "Execution Date,Value Date,,ID,Details,,Amount,,Balance\r\n";
	var lines = filecontent.split('\n');
	var prevline = "";
    for(var line = 1; line < lines.length; line++){
		linestr = prevline + lines[line];
		//linestr = linestr.substring(1, linestr.length - 1);
		var columns = linestr.split(',');
		
		// check lines without data
		if(columns.length == 1){
			continue;
		}
		
		var array = CSVToArray(linestr, ",");
		// skip bad lines
		if((array[0][0].indexOf("Period") == 0)
			||(array[0][0].indexOf("Account number") == 0)
			||(array[0][0].indexOf("Date Issued") == 0)
			||(array[0][0].indexOf("Currency") == 0)
			||(array[0][0].indexOf("Starting Balance") == 0)
			||(array[0][0].indexOf("Debit Turnover") == 0)
			||(array[0][0].indexOf("Credit Turnover") == 0)
			||(array[0][0].indexOf("Execution Date") == 0)
			||(array[0][0] == "")){
			continue;
		}
		
		//console.log(linestr);
		
		// if Details ocupate two lines then save this part and skip 
		if (array[0].length != 9){
			prevline = linestr;// + "";
			continue;
		}else{
			prevline = "";
		}
		
		
		// cut time when exists
		array[0][0] = array[0][0].split(' ')[0];
		
		// del "." in numbers, and replace "," to "."
		// 6.190,00 -> 6190.00
		array[0][6] = array[0][6].replace('.', '').replace(',','.');
		array[0][8] = array[0][8].replace('.', '').replace(',','.');
		
		string += array[0][0] + ","    						//Execution Date
					+ array[0][1] + ","						//Value Date
					+ "," 									//
					+ array[0][3] + "," 					//ID
					+ array[0][4] + ","						//Details
					+ ","									//
					+ array[0][6] + ","						//Amount
					+ ","									//
					+ array[0][8] + "\r\n";					//Balance
    }
	return string;
}

function readFile(file) {
  const reader = new FileReader();
  const ext = re.exec(file.name)[1];
  
  reader.addEventListener('load', (event) => {
    var result = event.target.result;
	fileName = file.name;
	
	if (ext.toLowerCase() == "xls"){
        var cfb = XLSX.read(event.target.result, {type: 'binary'});
        result = XLS.utils.make_csv(cfb.Sheets[cfb.SheetNames[0]]);   
	}
	
	var string = "";
	if(result.split('\n')[0] == '"Posting Date","Value Date","UTN","Description","Debit","Credit","Balance"'){
		string = convertEurobank(result);//"Posting Date,Value Date,UTN,Description,Payee,Debit_Credit,Balance\n";
	}else if(result.split('\n')[0] == 'reference,datetime,valuedate,debit,credit,trname,contragent,rem_i,rem_ii,rem_iii\r'){
		string = convertFIBank(result);
	}else if(result.split('\n')[0] == '"Account owner","Account number","Account type",Currency,Description,Balance'){
		string = convertPaymentExecution(result);
	}else if(result.split('\n')[0] == ',,,,,THE LUCK FACTORY EUROPE LTD,,,'){
		string = convertEcommBX(result);
	}else if((ext == "xls")&&(result.split('\n')[0] == 'ACCOUNT NO,PERIOD,CURRENCY,DATE,DESCRIPTION,DEBIT,CREDIT,VALUE DATE,BALANCE')){
		string = convertHellenic(result);//"Posting Date,Value Date,UTN,Description,Payee,Debit_Credit,Balance\n";
	}else{
		showout.innerHTML  = "Do not recognize the bank";
		return;
	}
	doSave(string, fileName, ext);
  });
  
  reader.addEventListener('error', (event) => {
	  showout.innerHTML  = reader.error; 
    });
  if ((ext.toLowerCase() == "xls")||(ext.toLowerCase() == "xlsx")){
	reader.readAsBinaryString(file);  
  }	else{
	reader.readAsText(file);  
  }
  
}

function doSave(content, filename, ext) {
	var today = new Date();
	var date = today.getFullYear() + String((today.getMonth()+1)).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
	var time = String(today.getHours()).padStart(2, '0')  + String(today.getMinutes()).padStart(2, '0')  + String(today.getSeconds()).padStart(2, '0');
	var dateTime = date+time;
	
	fileName = filename.slice(0,filename.length - ext.length -1) + '_converted_at_' + dateTime + '.csv';
	
    var blob = new Blob([content], {
        type: "data:text/plain;charset=utf-8"
    });
	
    saveAs(blob, fileName);
	date = today.getFullYear()+'.'+String((today.getMonth()+1)).padStart(2, '0')+'.'+String(today.getDate()).padStart(2, '0');
	time = today.getHours() + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2, '0');
	dateTime = date+" "+time;
	showout.innerHTML  = fileName + " successfully converted at " + dateTime; 
}