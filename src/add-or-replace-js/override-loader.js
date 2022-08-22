var cachedAssetUrl = {};
function getAsset(url) {
   console.log(url)
   if (cachedAssetUrl[url]) {
	   return {
		url: cachedAssetUrl[url],
		mine
	  };
   } else {
	  var data = window.res[url].split('---');
	  var mine = data[0]
	  var base64 = data[1];
	  var binary_string = window.atob(base64);
	  var len = binary_string.length;
	  var bytes = new Uint8Array(len);
	  for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	  }

	  var blob = new Blob([bytes], {
		type: mine
	  });
	  
	  var createdUrl = URL.createObjectURL(blob);
	  cachedAssetUrl[url] = createdUrl;
	  
	  return {
		url: createdUrl,
		mine
	  };
  }
}

function overrideLoader() {

  var baseName = function (e) {
    var n = e.indexOf("?");
    n > 0 && (e = e.substring(0, n));
    var i = /(\/|\\)([^\/\\]+)$/g.exec(e.replace(/(\/|\\)$/, ""));
    if (!i) return e;
    var r = i[2];
    return t && e.substring(e.length - t.length).toLowerCase() === t.toLowerCase() ? r.substring(0, r.length - t.length) : r
  }

  var downloadFile = cc.assetManager.downloader.downloadFile;
  cc.assetManager.downloader.downloadFile = function (url, options, onProgress, onComplete) {
    var asset = getAsset(url);
    options.xhrMimeType = asset.mine;
    downloadFile(asset.url, options, onProgress, onComplete)
  }

  var downloadDomImage = cc.assetManager.downloader.downloadDomImage;
  cc.assetManager.downloader.downloadDomImage = function (url, options, onComplete) {
    var asset = getAsset(url);
    options.xhrMimeType = asset.mine;
    downloadDomImage(asset.url, options, onComplete)
  }

  var downloadScript = cc.assetManager.downloader.downloadScript;
  cc.assetManager.downloader.downloadScript = function (url, options, onComplete) {
    var asset = getAsset(url);
    options.xhrMimeType = asset.mine;
    downloadScript(asset.url, options, onComplete)
  }
  
  // Image
  function loadDomImage(url, options, onComplete) {
	
	var data = window.res[url].split('---');
	var mine = data[0]
	var base64 = data[1];

	var index = url.lastIndexOf('.');
    var strtype = url.substr(index + 1, 4);
    strtype = strtype.toLowerCase();

	var mineType;
	if (strtype == 'png') {
		mineType = 'data:image/png;base64,';
	} else if (strtype == 'jpg' || strtype == 'jpeg') {
		mineType = 'data:image/jpeg;base64,';
	} else if (strtype == 'webp') {
		mineType = 'data:image/webp;base64,';
	}

	var imgStr = mineType + base64;
    var img = new Image();

    if (window.location.protocol !== 'file:') {
      img.crossOrigin = 'anonymous';
    }

    function loadCallback() {
      img.removeEventListener('load', loadCallback);
      img.removeEventListener('error', errorCallback);
      onComplete && onComplete(null, img);
    }

    function errorCallback() {
      img.removeEventListener('load', loadCallback);
      img.removeEventListener('error', errorCallback);
      onComplete && onComplete(new Error(cc.debug.getError(4930, url)));
    }

    img.addEventListener('load', loadCallback);
    img.addEventListener('error', errorCallback);
    img.src = imgStr;
    return img;
  }

  var downloadImageWrapper = function (url, options, onComplete) {
    if (cc.sys.hasFeature(cc.sys.Feature.IMAGE_BITMAP) && cc.assetManager.allowImageBitmap) {
      options.xhrResponseType = 'blob';
      cc.assetManager.downloader.downloadFile(url, options, options.onFileProgress, onComplete);
    } else {
      //cc.assetManager.downloader.downloadDomImage(url, options, onComplete);
	  loadDomImage(url, options, onComplete);
    }
  }

  var downloadArrayBufferWrapper = function (url, options, onComplete) {
    	  var data = window.res[url].split('---');
	  var mine = data[0]
	  var base64 = data[1];
	  var binary_string = window.atob(base64);
	  var len = binary_string.length;
	  var bytes = new Uint8Array(len);
	  for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	  }
	  onComplete(null, bytes);
  }

  var downloadTextWrapper = function (url, options, onComplete) {
    options.xhrResponseType = 'text';
    cc.assetManager.downloader.downloadFile(url, options, options.onFileProgress, onComplete);
  }

  var downloadCCONBWrapper = function (url, options, onComplete) {
    downloadArrayBufferWrapper(url, options, (err, arrayBuffer) => {
      if (err) {
        onComplete(err);
        return;
      }
      try {
        const ccon = cc.internal.decodeCCONBinary(new Uint8Array(arrayBuffer));
        onComplete(null, ccon);
      } catch (err) {
        onComplete(err);
      }
    });
  }

  var downloadJsonWrapper = function (url, options, onComplete) {

    //options.xhrResponseType = 'json';
    //cc.assetManager.downloader.downloadFile(url, options, options.onFileProgress, onComplete)
	
	var data = window.res[url].split('---');
	var mine = data[0]
	var base64 = data[1];
	var binary_string = window.atob(base64);

	var json = JSON.parse(binary_string);
	onComplete(null, json);
  }

  var downloadBundleWrapper = function (url, options, onComplete) {
    var bn = baseName(url)
    url = `assets/${bn}`;
    var config = `${url}/config.json`;
    //console.log("bundle........." + config)
    var count = 0;
    var out = ""
    downloadJsonWrapper(config, options, (err, response) => {
      //var error = err;  
      out = response;
      out.base = `${url}/`;
      if (++count === 2) {
        onComplete(err, out);
      }
    })
    var jspath = `${url}/index.js`;
    cc.assetManager.downloader.downloadScript(jspath, options, (err) => {

      if (++count === 2) {
        onComplete(err, out);
      }
    });
  }
  
  if (cc.internal.VideoPlayerImplManager) {
		function e(e, t, onComplete) {
			var video = document.createElement("video"), source = document.createElement("source");
			video.appendChild(source); 
			source.src = getAsset(e).url;
			onComplete(null, video);
		}

		cc.assetManager.downloader.register({
			".mp4": e,
			".avi": e,
			".mov": e,
			".mpg": e,
			".mpeg": e,
			".rm": e,
			".rmvb": e
		});
		const r = cc.internal.VideoPlayerImplManager.getImpl;
		cc.internal.VideoPlayerImplManager.getImpl = function (url) {
			const t = r.call(this, url), n = t.createVideoPlayer;
			return t.createVideoPlayer = function (url) {
				var t = getAsset(url);
				return t ? n.call(this, t.url) : n.call(this, url)
			}, t
		}
	}

  cc.assetManager.downloader.register({
    '.png': downloadImageWrapper,
    '.jpg': downloadImageWrapper,
    '.bmp': downloadImageWrapper,
    '.jpeg': downloadImageWrapper,
    '.gif': downloadImageWrapper,
    '.ico': downloadImageWrapper,
    '.tiff': downloadImageWrapper,
    '.webp': downloadImageWrapper,
    '.image': downloadImageWrapper, 
    '.binary': downloadArrayBufferWrapper,
    '.bin': downloadArrayBufferWrapper,
    '.dbbin': downloadArrayBufferWrapper,
    '.skel': downloadArrayBufferWrapper,
    '.zip': downloadTextWrapper,
    '.cconb': downloadCCONBWrapper,
    '.json':downloadJsonWrapper,
    'bundle': downloadBundleWrapper
  });
}

function externDownloadArrayBuffer(url, onComplete) {
  //console.log("externDownloadArrayBuffer:"+url);
  var data = window.res[url].split('---');
  var base64 = data[1];
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  onComplete(bytes.buffer)
}