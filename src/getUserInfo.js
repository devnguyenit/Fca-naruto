"use strict";

var utils = require("../utils");
var log = require("npmlog");

function formatData(data) {
  var retObj = {};

  for (var prop in data) {
    // eslint-disable-next-line no-prototype-builtins
    if (data.hasOwnProperty(prop)) {
      var innerObj = data[prop];
      retObj[prop] = {
        name: innerObj.name,
        firstName: innerObj.firstName,
        vanity: innerObj.vanity,
        thumbSrc: innerObj.thumbSrc,
        profileUrl: innerObj.uri,
        gender: innerObj.gender,
        type: innerObj.type,
        isFriend: innerObj.is_friend,
        isBirthday: !!innerObj.is_birthday
      };
    }
  }

  return retObj;
}

module.exports = function (defaultFuncs, api, ctx) {
  const Database = require('../Extra/Database');
  return function getUserInfo(id, callback) {
    var resolveFunc = function () { };
    var rejectFunc = function () { };
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err, userInfo) {
        if (err) return rejectFunc(err);
        resolveFunc(userInfo);
      };
    }

    if (utils.getType(id) !== "Array") id = [id];
    if (Database(true).has('UserInfo') == false) Database(true).set('UserInfo', []);
    var DatabaseUser = Database(true).get('UserInfo', {}) || [];
    var respone = [];
    var Nope = [];
    if (global.Fca.Data.Userinfo != undefined && global.Fca.Data.Userinfo.length != 0) {
      if (id.length == 1) {
        if (global.Fca.Data.Userinfo[0].some(i => i.id == id[0])) {
          let Format = {};
          Format[id[0]] = global.Fca.Data.Userinfo[0].find(i => i.id == id[0]);
          callback(null,Format);
        }
        else if (DatabaseUser.some(i => i.id == id[0])) {
          let Format = {};
          Format[id[0]] = DatabaseUser.find(i => i.id == id[0]);
          callback(null,Format);
        }
        else {
          Nope.push(id[0]);
        }
      } 
      else for (let ii of id) {
        if (global.Fca.Data.Userinfo[0].some(i => i.id == ii)) {
          let Format = {}
          Format[id[ii]] = global.Fca.Data.Userinfo[0].find(i => i.id == ii);
          respone.push(Format);
        }
        else if (DatabaseUser.some(i => i.id == ii)) {
          let Format = {};
          Format[id[ii]] = DatabaseUser.find(i => i.id == ii);
          respone.push(Format);
        }
        else {
          Nope.push(ii);
        }
      }
      if (Nope.length > 0 && respone > 0) {
        var form = {};
        Nope.map(function (v, i) {
          form["ids[" + i + "]"] = v;
        });
        defaultFuncs
          .post("https://www.facebook.com/chat/user_info/", ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error) throw resData;
            respone.push(formatData(resData.payload.profiles));
            callback(null, respone);
          })
          .catch(function (err) {
            log.error("getUserInfo", "Lỗi: getUserInfo Có Thể Do Bạn Spam Quá Nhiều !,Hãy Thử Lại !");
            return callback(err, respone);
          });
        return returnPromise;
      }
      else if (Nope.length > 0 && respone <= 0) {
        let form = {};
        Nope.map(function (v, i) {
          form["ids[" + i + "]"] = v;
        });
        defaultFuncs
          .post("https://www.facebook.com/chat/user_info/", ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error) throw resData;
            callback(null, formatData(resData.payload.profiles));
          })
          .catch(function (err) {
            log.error("getUserInfo", "Lỗi: getUserInfo Có Thể Do Bạn Spam Quá Nhiều !,Hãy Thử Lại !");
            return callback(err, respone);
          });
        return returnPromise;
      };
      return returnPromise
    }
    else {
      let form = {};
        id.map(function (v, i) {
          form["ids[" + i + "]"] = v;
        });
        defaultFuncs
          .post("https://www.facebook.com/chat/user_info/", ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error) throw resData;
            callback(null, formatData(resData.payload.profiles));
          })
          .catch(function (err) {
            log.error("getUserInfo", "Lỗi: getUserInfo Có Thể Do Bạn Spam Quá Nhiều !,Hãy Thử Lại !");
            callback(err, formatData(resData.payload.profiles));
          });
        return returnPromise;
    }
  };
};
