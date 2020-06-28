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

function convertEurobank(filecontent){
	let string = "Posting Date,Value Date,UTN,Description,Payee,Debit_Credit,Balance\r\n";
	var lines = filecontent.split('\n');
    for(var line = 1; line < lines.length; line++){
		linestr = lines[line];
		linestr = linestr.substring(1, linestr.length - 1);
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
		
		var description = columns[3].split(' - ')[0];
		var payee = "";
		if(columns[3].split(' - ').length > 1){
			payee = columns[3].split(' - ')[1];
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

function readFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    const result = event.target.result;
	
	

	
	//showout.innerHTML  = result; 
	fileName = file.name;
	ext = re.exec(file.name)[1];
	
	var today = new Date();
	var date = today.getFullYear() + String((today.getMonth()+1)).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
	var time = +String(today.getHours()).padStart(2, '0')  + String(today.getMinutes()).padStart(2, '0')  + String(today.getSeconds()).padStart(2, '0');
	var dateTime = date+time;
	
	fileName = file.name.slice(0,file.name.length - ext.length -1) + '_converted_at_' + dateTime + '.csv';
	
	var string = "";
	// chekBankSignature
	if(result.split('\n')[0] == '"Posting Date","Value Date","UTN","Description","Debit","Credit","Balance"'){
		string = convertEurobank(result);//"Posting Date,Value Date,UTN,Description,Payee,Debit_Credit,Balance\n";
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
  reader.readAsText(file);
}

function uploadFile(file, i) {
	//alert("hello");
  /*var url = 'https://api.cloudinary.com/v1_1/joezimim007/image/upload'
  var xhr = new XMLHttpRequest()
  var formData = new FormData()
  xhr.open('POST', url, true)
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')

  // Update progress (can be used to show progress indicator)
  xhr.upload.addEventListener("progress", function(e) {
    updateProgress(i, (e.loaded * 100.0 / e.total) || 100)
  })

  xhr.addEventListener('readystatechange', function(e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      updateProgress(i, 100) // <- Add this
    }
    else if (xhr.readyState == 4 && xhr.status != 200) {
      // Error. Inform the user
    }
  })

  formData.append('upload_preset', 'ujpu6gyk')
  formData.append('file', file)
  xhr.send(formData)*/
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