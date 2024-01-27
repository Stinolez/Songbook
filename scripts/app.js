'use strict';

var app = (function () {

  // Private variables
  var appName    = 'Zpěvník'
    , appVersion = '01.0001'
    , appOwner   = 'Tomáš \'Stínolez\' Vitásek';

  // Create element
  function createElement(elementType, data) {

    /********************************************************************
    | Element | Data                                                    |
    ---------------------------------------------------------------------
    | div     | [className, attributes, HTML content]                   |
    | span    |                                                         |
    | h2      |                                                         |
    | p       |                                                         |
    | tr      |                                                         |
    | td      |                                                         |
    | li      |                                                         |
    | img     |                                                         |
    ---------------------------------------------------------------------
    | ul      | [className, attributes, [                               |
    | ol      |                           [className, attributes, 1],   |
    |         |                           [className, attributes, 2],   |
    |         |                           ...                           |
    |         |                         ]]                              |
    |         |                                                         |
    ********************************************************************/

    // Create element by the type
    let element    = document.createElement(elementType)
      , attributes = JSON.parse(data[1]);

    // Use different settings for different element types
    switch(elementType) {

      // Element: div, span, ul, li
      case 'div':
      case 'span':
      case 'h2':
      case 'p':
      case 'tr':
      case 'td':
      case 'li':
      case 'img':

        element.className = data[0];
        element.innerHTML = data[2];

        for (let attr in attributes) {
          if (attr.indexOf('data-') === -1) {
            element[attr] = attributes[attr];
          } else {
            element.dataset[attr.replace('data-', '')] = attributes[attr];
          }
        }
        break;

      // List elements
      case 'ul':
      case 'ol':

        let listData = data[2];
        element.className = data[0];

        for (let attr in attributes) {
          if (attr.indexOf('data-') === -1) {
            element[attr] = attributes[attr];
          } else {
            element.dataset[attr.replace('data-', '')] = attributes[attr];
          }
        }

        for (let i = 0; i < listData.length; i++) {
          let sub = createElement('li', listData[i]);
          element.appendChild(sub);
        }
        break;

    }

    return element;

  }

  // Load JSON file
  function loadJSON(callback, filepath) {

    var xobj = new XMLHttpRequest();

    xobj.overrideMimeType("application/json");
    xobj.open('GET', filepath, true);

    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {
        callback(xobj.responseText);
      }
    };

    xobj.send(null);
  }

  // Function to comparable string
  function comparable(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // Sort array by key
  function sortByKey(array, key) {
    return array.sort(function(a, b) {
      let x = comparable(a[key])
        , y = comparable(b[key]);
      return ((x < y ? -1 : ((x > y) ? 1 : 0)));
    });
  }

  // Decoding chrods in line of text
  function decodeChords(str) {
    return str.replaceAll('{', '<span class="chord">').replaceAll('}', '</span>');
  }

  // Registering list of songs on the main page
  function registerSongs(json) {

    let data     = JSON.parse(json).data
      , songList = document.getElementById('song-list');

    // Data sort
    data = sortByKey(data, 'name');

    // Going through list of songs
    for (let i = 0; i < data.length; i++) {

      // Defining song data / new elements
      let name   = data[i].name
        , author = data[i].author
        , tags   = comparable(name + '|' + author)
        , uid    = data[i].uid
        , d_attr = {"data-tags": tags, "data-uid": uid}
        , song   = createElement('li', ['song', JSON.stringify(d_attr), name]);

      // Append the elements
      songList.appendChild(song);

    }

    // Register click
    if (document.getElementsByClassName('song').length > 0) {
      for (let i = 0; i < document.getElementsByClassName('song').length; i++) {
        document.getElementsByClassName('song')[i].addEventListener('click', function(e) {
          location.href = 'index.html?uid=' + e.target.dataset.uid;
        });
      }
    }

  }

  // Registering song
  function registerSong(json) {

    let data       = JSON.parse(json)
      , songDetail = document.getElementById('song-detail')
      , songText   = createElement('div', ['song-text', '{}', '']);

    // Clear previous data
    songDetail.innerHTML = '';

    // Add song details
    let title = createElement('h2', ['', '{}', data.name + ' <span class="author">(' + data.author + ')</span>']);
    songDetail.appendChild(title);

    // Add chords
    for (let i = 0; i < data.chords.length; i++) {
      let image  = 'images/chords/' + data.chords[i] + '.png'
        , i_attr = {"src": image, "alt": data.chords[i]}
        , img    = createElement('img', ['', JSON.stringify(i_attr), ''])
      songDetail.appendChild(img);
    }

    // Add song text
    for (let i = 0; i < data.text.length; i++) {
      let section     = data.text[i]
        , songSection = createElement('div', ['song-section', '{}', '']);

      for (let j = 0; j < section.length; j++) {
        let text     = section[j]
          , songLine = createElement('p', ['song-line', '{}', decodeChords(text)]);
        songSection.appendChild(songLine);
      }

      songText.appendChild(songSection);
    }

    songDetail.appendChild(songText);

  }

  // Return an object exposed to the public
  return {

    // Get application name
    getAppName: function() {
      return appName;
    },

    // Get application version
    getAppVersion: function() {
      return appVersion;
    },

    // Get application owner
    getAppOwner: function() {
      return appOwner;
    },

    // Publicly facing createElement function
    createElement: function(elementType, data) {
      return createElement(elementType, data);
    },

    // Init function
    init: function() {

      // Register search function
      if (document.getElementById('song-search')) {

        document.getElementById('song-search').addEventListener('keyup', function(e) {

          let search = comparable(document.getElementById('song-search').value);

          if (search !== '') {
            for (let i = 0; i < document.getElementsByClassName('song').length; i++) {
              let tags = document.getElementsByClassName('song')[i].dataset.tags.split('|')
                , matches = tags.filter(s => s.includes(search));
              if (matches.length === 0) {
                document.getElementsByClassName('song')[i].style.display = 'none';
              } else {
                document.getElementsByClassName('song')[i].style.display = 'block';
              }
            }
          } else {
            for (let i = 0; i < document.getElementsByClassName('song').length; i++) {
              document.getElementsByClassName('song')[i].style.display = 'block';
            }
          }

        });

      }

      // Register list of songs
      if (document.getElementById('song-list')) {
        loadJSON(registerSongs, '../data/_main.json');
      }

      // Register song details
      if (document.getElementById('song-detail')) {
        const queryString = window.location.search
            , urlParams   = new URLSearchParams(queryString);
        if (urlParams.get('uid')) {
          loadJSON(registerSong, '../data/' + urlParams.get('uid') + '.json');
        }
      }

    }

  };
})();

// Run the init function
app.init();
