//#region Misc

document.querySelector('#icon').onclick = function () {
  location.reload();
}

const colors = ['#00171f', '#003459', '#174668', '#001f29', '#005c7a', '#17afe4', '#172c33'];

//#endregion

//#region show/hide Divs

let menuList = document.querySelector('#menu').children;
let divsList = document.querySelectorAll('.showHide');

for (let i = 0; i < menuList.length; i++) {
  menuList[i].style.backgroundColor = colors[i];
  divsList[i].style.backgroundColor = colors[i];

  menuList[i].onclick = function () {
    for (let j = 0; j < menuList.length; j++) {
      menuList[j].style.border = "solid 1px rgba(0,0,0,0)";
    }
    menuList[i].style.border = "solid 1px white";
    show(divsList[i]);
    document.querySelector('#responseMessage').innerHTML = 'Response message';
    document.querySelector('#JSONresponse').innerHTML = 'JSON response';
    for (let j = 0; j < document.querySelectorAll('input').length; j++) {
      document.querySelectorAll('input')[j].value = null;
    }
    document.querySelector('#peopleSearchResults').innerHTML = ('People information displayed here.....<br><br><br><br>');
  }
}

function show(selectedClass) {
  for (let i = 0; i < divsList.length; i++) {
    divsList[i].style.display = "none";
  }
  selectedClass.style.display = 'flex';
}

//#endregion

//#region Displaying results

function displayJson(JsonResponse) {
  document.querySelector('#JSONresponse').innerHTML = `<pre>${JSON.stringify(JSON.parse(JsonResponse), null, 2)}</pre>`;
}

function displayObject(object) {
  document.querySelector('#JSONresponse').innerHTML = `<pre>${JSON.stringify(object, null, 2)}</pre>`;
}

function displayMessage(message) {
  document.querySelector('#responseMessage').innerHTML = message;
}

//#endregion

//#region Authentification

let token = { access_token: 'NoToken' };

window.onload = testLog;

function testLog() {
  if (sessionStorage.getItem('token')) {
    document.querySelector('#authentLogout').removeAttribute('disabled');
    document.querySelector('#loggedAs').innerHTML = `Logged as ${JSON.parse(sessionStorage.getItem('token')).userName}`;
    token = JSON.parse(sessionStorage.getItem('token'));
  } else {
    document.querySelector('#loggedAs').innerHTML = 'Logged out';
    document.querySelector('#authentLogout').setAttribute('disabled', '');
  }
}

document.querySelector('#authentGo').onclick = function () {
  let username = document.querySelector('#username').value;
  let password = document.querySelector('#password').value;
  authent(username, password);
}

function authent(username, password) {
  const authentReq = new XMLHttpRequest();
  authentReq.onload = function () {
    if (this.status === 200) {
      console.log(JSON.parse(this.response));
      displayMessage('200 Access granted OK');
      displayJson(this.response);
      token = JSON.parse(this.response);
      sessionStorage.setItem('token', this.response);
      testLog();
    } else if (this.status === 400) {
      console.log(JSON.parse(this.response));
      displayJson(this.response);
      displayMessage('400 Access denied or bad request');
    } else {
      console.log(JSON.parse(this.response));
      displayJson(this.response);
      displayMessage('Something went wrong with auth...');
    }
  }
  authentReq.open('POST', 'https://easyjob.nov.group:8008/token');
  authentReq.send(`grant_type=password&username=${username}&password=${password}`)
}

document.querySelector('#authentLogout').onclick = logout;

function logout() {
  sessionStorage.removeItem('token');
  testLog();
  ejPost('Common/Logout', '{}');
  token = { access_token: 'NoToken' };
}

//#endregion

//#region Get, Post 

document.querySelector('#getButton').onclick = function () {
  const value = document.querySelector('#get').value;
  document.querySelector('#responseMessage').innerHTML = 'Response message';
  document.querySelector('#JSONresponse').innerHTML = 'JSON response';
  ejGet(value);
}

document.querySelector('#postButton').onclick = function () {
  const url = document.querySelector('#postUrl').value;
  const content = document.querySelector('#postContent').value;
  document.querySelector('#responseMessage').innerHTML = 'Response message';
  document.querySelector('#JSONresponse').innerHTML = 'JSON response';
  ejPost(url, content);
}

function ejGet(url) {
  return new Promise(function (resolve, reject) {
    const getReq = new XMLHttpRequest();
    getReq.onload = function () {
      if (this.status === 200) {
        console.log(JSON.parse(this.response));
        displayJson(this.response);
        displayMessage('200 response OK');
        resolve(JSON.parse(this.response));
      } else if (this.status === 401) {
        console.log(JSON.parse(this.response));
        displayJson(this.response);
        displayMessage('401 Access denied to GET request');
        reject(this.statusText);
      } else {
        console.log(JSON.parse(this.response));
        displayJson(this.response);
        displayMessage('Something went wrong with GET request');
        reject(this.statusText);
      }
    }
    getReq.open('GET', `https://easyjob.nov.group:8008/api.json/${url}`);
    getReq.setRequestHeader('Authorization', 'Bearer ' + token.access_token);
    getReq.send();
  })
}

function ejPost(url, content) {
  const postReq = new XMLHttpRequest();
  postReq.onload = function () {
    if (this.status === 200) {
      console.log(JSON.parse(this.response));
      displayJson(this.response);
      displayMessage('200 response OK')
    } else if (this.status === 401) {
      console.log(JSON.parse(this.response));
      displayJson(this.response);
      displayMessage('401 Access denied to POST request');
    } else {
      console.log(JSON.parse(this.response));
      displayJson(this.response);;
      displayMessage('Something went wrong with POST request');
    }
  }
  postReq.open('POST', `https://easyjob.nov.group:8008/api.json/${url}`);
  postReq.setRequestHeader('Authorization', 'Bearer ' + token.access_token);
  postReq.send(`${content}`);
}

//#endregion

//#region People

class Tech {
  constructor(allocation, name, caption, startDate, endDate, rate, phone, email) {
    this.allocation = allocation;
    this.name = name;
    this.caption = caption;
    this.startDate = startDate;
    this.endDate = endDate;
    this.rate = rate;
    this.email = email;
    this.phone = phone;
  }
}

let techs;

document.querySelector('#peopleGoButton').onclick = function () {
  getPeopleFromJob(document.querySelector('#peopleJobNumber').value);
}

function getPeopleFromJob(jobNumber) {
  techs = [];
  ejGet(`projects/list?searchtext=${jobNumber.slice(0, jobNumber.length - 3)}`)
    .then(function (result) {
      return (result)[0].Id;
    })
    .then(function (result) {
      ejGet(`projects/details/${result}`)
        .then(function (result) {
          for (let i = 0; i < result.Jobs.length; i++) {
            if (result.Jobs[i].Number === jobNumber) {
              return (result.Jobs[0].ID);
            }
          };
        })
        .then(function (result) {
          ejGet(`Resources/List2Object/${result}`)
            .then(function (result) {
              for (let i = 0; i < result.length; i++) {
                if (result[i].Type === 'Staff') {
                  let tech = new Tech(result[i].IdResourceFunctionAllocation, '', result[i].Caption, result[i].StartDate, result[i].EndDate, result[i].Rate, '', '');
                  techs.push(tech);
                }
              }
              return (techs);
            })
            .then(function (result) {
              for (let i = 0; i < result.length; i++) {
                ejGet(`Resources/Details/${techs[i].allocation}`)
                  .then(function (result) {
                    techs[i].name = (result.AllocationList[0].Caption);
                    return (result.AllocationList[0].IdAddress);
                  })
                  .then(function (result) {
                    ejGet(`addresses/details/${result}`)
                      .then(function (result) {
                        if (result.Phone) {
                          techs[i].phone = result.Phone;
                        }
                        else if (result.PrimaryContact.Mobile) {
                          techs[i].phone = result.PrimaryContact.Mobile;
                        }
                        else if (result.PrimaryContact.Phone) {
                          techs[i].phone = result.PrimaryContact.Phone;
                        }
                        if (result.EMail) {
                          techs[i].email = result.EMail;
                        }
                        else if (result.PrimaryContact.EMail) {
                          techs[i].email = result.PrimaryContact.EMail;
                        }
                        displayTechs();
                      })
                  })
              }
            });
        })
    })
}

function techsSort() {
  techs.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  })
}

document.querySelector('#sortButton').onclick = function () {
  techsSort();
  displayTechs();
}

function displayTechs() {

  document.querySelector('#peopleSearchResults').innerHTML = (null);

  let table = document.createElement("table");
  document.querySelector('#peopleSearchResults').appendChild(table);

  for (let i = 0; i < techs.length; i++) {
    let line = document.createElement('tr');
    document.querySelector('#peopleSearchResults').firstChild.appendChild(line);
    let name = document.createElement('td');
    name.innerHTML = `${techs[i].name}`;
    document.querySelector('#peopleSearchResults').firstChild.children[i].appendChild(name);
    let caption = document.createElement('td');
    caption.innerHTML = `${techs[i].caption}`;
    document.querySelector('#peopleSearchResults').firstChild.children[i].appendChild(caption);
    let startDate = document.createElement('td');
    startDate.innerHTML = `${techs[i].startDate}`;
    document.querySelector('#peopleSearchResults').firstChild.children[i].appendChild(startDate);
    let endDate = document.createElement('td');
    endDate.innerHTML = `${techs[i].endDate}`;
    document.querySelector('#peopleSearchResults').firstChild.children[i].appendChild(endDate);
    let rate = document.createElement('td');
    rate.innerHTML = `${techs[i].rate}`;
    document.querySelector('#peopleSearchResults').firstChild.children[i].appendChild(rate);
    let phone = document.createElement('td');
    phone.innerHTML = `${techs[i].phone}`;
    document.querySelector('#peopleSearchResults').firstChild.children[i].appendChild(phone);
    let email = document.createElement('td');
    email.innerHTML = `${techs[i].email}`;
    document.querySelector('#peopleSearchResults').firstChild.children[i].appendChild(email);
  }

  displayObject(techs);
  displayMessage('Successful to get techs List');
}

//#endregion