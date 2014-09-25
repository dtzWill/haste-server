///// represents a single document

var haste_document = function() {
  this.locked = false;
};

// Escapes HTML tag characters
haste_document.prototype.htmlEscape = function(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
};

// Get this document from the server and lock it here
haste_document.prototype.load = function(key, callback, lang) {
  var _this = this;
  $.ajax('/docs/' + key, {
    type: 'get',
    headers: {
      accept: 'text/plain'
    },
    success: function(data) {
      _this.locked = true;
      _this.key = key;
      _this.data = data;

      try {
        var high;
        if (lang === 'txt') {
          high = { value: _this.htmlEscape(data) };
        } else if (lang) {
          high = hljs.highlight(lang, data);
        } else {
          high = hljs.highlightAuto(data);
        }
      } catch(err) {
        // failed highlight, fall back on auto
        high = hljs.highlightAuto(data);
      }
      callback({
        value: high.value,
        key: key,
        language: high.language || lang,
        lineCount: data.split("\n").length
      });
    },
    error: function(err) {
      callback(false);
    }
  });
};

// Save this document to the server and lock it here
haste_document.prototype.save = function(data, callback) {
  if (this.locked) {
    return false;
  }
  this.data = data;
  var _this = this;
  $.ajax('/docs', {
    type: 'post',
    data: data,
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: function(res) {
      _this.locked = true;
      _this.key = res.key;
      var high = hljs.highlightAuto(data);
      callback(null, {
        value: high.value,
        key: res.key,
        language: high.language,
        lineCount: data.split("\n").length
      });
    },
    error: function(res) {
      try {
        callback($.parseJSON(res.responseText));
      } catch (e) {
        callback({message: 'Something went wrong!'});
      }
    }
  });
};

///// represents the paste application

var haste = function(appName, options) {
  this.appName = appName;
  this.$textarea = $('textarea');
  this.$box = $('#box');
  this.$code = $('#box code');
  this.$linenos = $('#linenos');
  this.$recents = $('#recent-pastes ul');
  this.$recentsTitle = $('#recent-pastes-title');
  this.options = options;
  this.configureShortcuts();
  this.configureButtons();
  this.loadRecentsList();
  
  var _this = this;
  var fileUploadOpts = {
    url: '/docs',
    dataType: 'json',
    onUploadSuccess: function(id, data) {
      var ext = '';
      var extIndex = data.metadata.name.lastIndexOf('.');
      if (extIndex > -1) {
        ext = data.metadata.name.substring(extIndex);
      }
      var href = '/' + data.key + ext;
      if (data.metadata.name && data.metadata.mimetype.indexOf('text') < 0) {
        href = '/docs' + href;

        // Add to recents list
        // Since the /docs/ version won't do so.
        var recents = _this.getRecents();
        recents = recents.filter(function(item) {
          return item !== data.key;
        });
        recents.unshift(data.key);
        recents = recents.slice(0, recents.length > 20 ? 20 : recents.length);
        localStorage.setItem('recents', JSON.stringify(recents));
      }

      window.location.assign(href);
    },
    onUploadError: function(id, message) {
      _this.showMessage(message);
    }
  };
  $('body').dmUploader(fileUploadOpts);
};

haste.prototype.linkify = function() {
  // Convert 'link_url' elements into functioning links!
  // Snippet based on code found here: http://stackoverflow.com/a/5215392
  $('.hljs-link_url').replaceWith(function() {
    var url = $.trim($(this).text());
    return '<a href="' + url + '" target="_blank">' + url + '</a>';
  });
};

// Set the page title - include the appName
haste.prototype.setTitle = function(ext) {
  var title = ext ? this.appName + ' - ' + ext : this.appName;
  document.title = title;
};

// Display currently used language highlighting
setLang = function(lang) {
  console.log("setLang() " + lang);
  $('#cur-lang').text(lang);
};

// Show a message box
haste.prototype.showMessage = function(msg, cls) {
  var msgBox = $('<li class="'+(cls || 'info')+'">'+msg+'</li>');
  $('#messages').prepend(msgBox);
  setTimeout(function() {
    msgBox.slideUp('fast', function() { $(this).remove(); });
  }, 3000);
};

// Show the light key
haste.prototype.lightKey = function() {
  this.configureKey(['new', 'save']);
};

// Show the full key
haste.prototype.fullKey = function() {
  this.configureKey(['new', 'duplicate', 'raw']);
};

// Set the key up for certain things to be enabled
haste.prototype.configureKey = function(enable) {
  var $this, i = 0;
  $('#box2 .function').each(function() {
    $this = $(this);
    for (i = 0; i < enable.length; i++) {
      if ($this.hasClass(enable[i])) {
        $this.addClass('enabled');
        return true;
      }
    }
    $this.removeClass('enabled');
  });
};

haste.prototype.getRecents = function() {
  var recents = localStorage.getItem('recents');
  if (recents) {
    return JSON.parse(recents);
  }
  return [];
};

haste.prototype.updateRecents = function() {
  var _this = this;
  var recents = this.getRecents();
  recents = recents.filter(function(item) {
    return item !== _this.doc.key;
  });
  recents.unshift(_this.doc.key);
  recents = recents.slice(0, recents.length > 20 ? 20 : recents.length);
  localStorage.setItem('recents', JSON.stringify(recents));
  this.loadRecentsList();
};

haste.prototype.loadRecentsList = function() {
  var recents = this.getRecents();
  var data = JSON.stringify(recents);
  $.ajax('/keys', {
    type: 'post',
    data: data,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function(res) {
      var items = '';
      for (var i in res) {
        var item = res[i];

        var title = item.name;
        var ext = '';
        var extIndex = title.lastIndexOf('.');
        if (extIndex > -1) {
          ext = title.substring(extIndex);
        }
        if (item.syntax) {
          ext = '.' + item.syntax;
        }
        
        if (!title) title = item.key + ext;
        var href = '/' + item.key + ext;
        if (item.name && item.mimetype.indexOf('text') < 0) {
          href = '/docs' + href;
        }
        items += '<li><a href="' + href + '">' + title + '</a></li>';
      }
      $('#recent-pastes ul').html(items);
    }
  });
}

// Remove the current document (if there is one)
// and set up for a new one
haste.prototype.newDocument = function() {
  this.$box.hide();
  this.doc = new haste_document();
  this.setTitle();
  this.lightKey();
  this.$textarea.val('').show('fast', function() {
    this.focus();
  });
  this.removeLineNumbers();
};

// Map of common extensions
// Note: this list does not need to include anything that IS its extension,
// due to the behavior of lookupTypeByExtension and lookupExtensionByType
// Note: optimized for lookupTypeByExtension
haste.extensionMap = {
  rb: 'ruby', py: 'python', pl: 'perl', php: 'php', scala: 'scala', go: 'go',
  xml: 'xml', html: 'xml', htm: 'xml', css: 'css', js: 'javascript', vbs: 'vbscript',
  lua: 'lua', pas: 'delphi', java: 'java', cpp: 'cpp', cc: 'cpp', m: 'objectivec',
  vala: 'vala', cs: 'cs', sql: 'sql', sm: 'smalltalk', lisp: 'lisp', ini: 'ini',
  diff: 'diff', bash: 'bash', sh: 'bash', tex: 'tex', erl: 'erlang', hs: 'haskell',
  md: 'markdown', txt: '', coffee: 'coffee', json: 'javascript'
};

// Look up the extension preferred for a type
// If not found, return the type itself - which we'll place as the extension
haste.prototype.lookupExtensionByType = function(type) {
  for (var key in haste.extensionMap) {
    if (haste.extensionMap[key] === type) return key;
  }
  return type;
};

// Look up the type for a given extension
// If not found, return the extension - which we'll attempt to use as the type
haste.prototype.lookupTypeByExtension = function(ext) {
  return haste.extensionMap[ext] || ext;
};

// Add line numbers to the document
// For the specified number of lines
haste.prototype.addLineNumbers = function(lineCount) {
  var h = '';
  for (var i = 0; i < lineCount; i++) {
    h += (i + 1).toString() + '<br/>';
  }
  $('#linenos').html(h);
};

// Remove the line numbers
haste.prototype.removeLineNumbers = function() {
  $('#linenos').html('&gt;');
};

// Load a document and show it
haste.prototype.loadDocument = function(key) {
  // Split the key up
  var ext = '';
  var extIndex = key.lastIndexOf('.');
  if (extIndex > -1 && extIndex < key.length - 1) {
    ext = key.substring(extIndex + 1);
    key = key.substring(0, extIndex);
  }
  // Ask for what we want
  var _this = this;
  _this.doc = new haste_document();
  _this.doc.load(key, function(ret) {
    if (ret) {
      _this.$code.html(ret.value);
      _this.linkify();
      _this.setTitle(ret.key);
      _this.fullKey();
      _this.$textarea.val('').hide();
      _this.$box.show().focus();
      _this.addLineNumbers(ret.lineCount);
      setLang(ret.language);
      _this.updateRecents();
    }
    else {
      _this.newDocument();
    }
  }, this.lookupTypeByExtension(ext));
};

// Duplicate the current document - only if locked
haste.prototype.duplicateDocument = function() {
  if (this.doc.locked) {
    var currentData = this.doc.data;
    this.newDocument();
    this.$textarea.val(currentData);
  }
};

// Lock the current document
haste.prototype.lockDocument = function() {
  var _this = this;
  this.doc.save(this.$textarea.val(), function(err, ret) {
    if (err) {
      _this.showMessage(err.message, 'error');
    }
    else if (ret) {
      window.location.assign('/' + ret.key);
    }
  });
};

haste.prototype.configureButtons = function() {
  var _this = this;
  this.buttons = [
    {
      $where: $('#box2 .save'),
      label: 'Save',
      shortcutDescription: 'ctrl + s',
      shortcut: function(evt) {
        return (evt.ctrlKey || evt.metaKey) && (evt.keyCode === 83);
      },
      action: function() {
        if (_this.$textarea.val().replace(/^\s+|\s+$/g, '') !== '') {
          _this.lockDocument();
        }
      }
    },
    {
      $where: $('#box2 .new'),
      label: 'New',
      shortcut: function(evt) {
        return (evt.ctrlKey || evt.metaKey) && evt.keyCode === 78  
      },
      shortcutDescription: 'ctrl + n',
      action: function() {
        _this.newDocument();
      }
    },
    {
      $where: $('#box2 .duplicate'),
      label: 'Duplicate & Edit',
      shortcut: function(evt) {
        return _this.doc.locked && (evt.ctrlKey || evt.metaKey) && evt.keyCode === 69;
      },
      shortcutDescription: 'ctrl + e',
      action: function() {
        _this.duplicateDocument();
      }
    },
    {
      $where: $('#box2 .raw'),
      label: 'Just Text',
      shortcut: function(evt) {
        return (evt.ctrlKey || evt.metaKey) && evt.keyCode === 68;
      },
      shortcutDescription: 'ctrl + d',
      action: function() {
        if (_this.doc.key) {
          window.location.assign('/docs/' + _this.doc.key);
        }
      }
    },
    {
      $where: null,
      label: 'Recent Posts',
      shortcut: function(evt) {
        return (evt.ctrlKey || evt.metaKey) && evt.shiftKey && evt.keyCode == 73;
      },
      shortcutDescription: 'ctrl + shift + i',
      action: function() {
        _this.showRecents = !_this.showRecents;
        _this.loadRecentPostsFromServer();
      }
    }
  ];
  for (var i = 0; i < this.buttons.length; i++) {
    this.configureButton(this.buttons[i]);
  }
};

haste.prototype.configureButton = function(options) {
  if (!options.$where) {
    return;
  }
  // Handle the click action
  options.$where.click(function(evt) {
    evt.preventDefault();
    if (!options.clickDisabled && $(this).hasClass('enabled')) {
      options.action();
    }
  });
  // Show the label
  options.$where.mouseenter(function(evt) {
    $('#box3 .label').text(options.label);
    $('#box3 .shortcut').text(options.shortcutDescription || '');
  });
  // Hide the label
  options.$where.mouseleave(function(evt) {
    $('#box3 .label').html('&nbsp;');
    $('#box3 .shortcut').html('&nbsp;');
  });
};

// Configure keyboard shortcuts for the textarea
haste.prototype.configureShortcuts = function() {
  var _this = this;
  $(document.body).keydown(function(evt) {
    var button;
    for (var i = 0 ; i < _this.buttons.length; i++) {
      button = _this.buttons[i];
      if (button.shortcut && button.shortcut(evt)) {
        evt.preventDefault();
        button.action();
        return;
      }
    }
  });
};

// Load recent posts to show in sidebar
haste.prototype.loadRecentPostsFromServer = function() {
  if (!this.showRecents) {
    this.$recents.html('');
    this.$recents.hide();
    this.$recentsTitle.hide();
    return;
  }

  this.$recents.show();
  this.$recentsTitle.show();

  $.ajax('/recent', {
    type: 'get',
    dataType: 'json',
    success: function(res) {
      var items = '';
      for (var i in res) {
        var item = res[i];

        var title = item.name;
        var ext = '';
        var extIndex = title.lastIndexOf('.');
        if (extIndex > -1) {
          ext = title.substring(extIndex);
        }
        if (item.syntax) {
          ext = '.' + item.syntax;
        }
        
        if (!title) title = item.key + ext;
        var href = '/' + item.key + ext;
        if (item.name && item.mimetype.indexOf('text') < 0) {
          href = '/docs' + href;
        }
        items += '<li><a href="' + href + '">' + title + '</a></li>';
      }
      $('#recent-pastes ul').html(items);
    }
  });
};

///// Tab behavior in the textarea - 2 spaces per tab
$(function() {

  $('textarea').keydown(function(evt) {
    if (evt.keyCode === 9) {
      evt.preventDefault();
      var myValue = '  ';
      // http://stackoverflow.com/questions/946534/insert-text-into-textarea-with-jquery
      // For browsers like Internet Explorer
      if (document.selection) {
        this.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
        this.focus();
      }
      // Mozilla and Webkit
      else if (this.selectionStart || this.selectionStart == '0') {
        var startPos = this.selectionStart;
        var endPos = this.selectionEnd;
        var scrollTop = this.scrollTop;
        this.value = this.value.substring(0, startPos) + myValue +
          this.value.substring(endPos,this.value.length);
        this.focus();
        this.selectionStart = startPos + myValue.length;
        this.selectionEnd = startPos + myValue.length;
        this.scrollTop = scrollTop;
      }
      else {
        this.value += myValue;
        this.focus();
      }
    }
  });
});

function setWrapping(wrap) {
	$('#box').toggleClass('wrapped', wrap);
	$('#linenos').toggle(!wrap);

	$('#wrapCheck').prop('checked', wrap);
	$('#nosCheck').prop('checked', !wrap);
}

function toggleWrapping() {
	setWrapping(!$('#wrapCheck').prop('checked'));
};

$(function() {
var fileSelect = document.getElementById("fileSelect"),
    fileElem = document.getElementById("fileElem");

fileSelect.addEventListener("click", function (e) {
  if (fileElem) {
    fileElem.click();
  }
  e.preventDefault(); // prevent navigation to "#"
}, false);

var wrapLink = document.getElementById("wrapToggle");

// Associate link with checkbox
wrapLink.addEventListener("click", function (e) {
	toggleWrapping();
  e.preventDefault();
}, false);

setWrapping(false);
});
