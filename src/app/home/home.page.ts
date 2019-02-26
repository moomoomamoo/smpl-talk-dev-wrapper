import { Component, ChangeDetectorRef, NgZone } from '@angular/core';

// import { Http, Response, Headers } from '@angular/http';//RequestOptions
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';

import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

// import 'rxjs/add/operator/map';

import { Platform } from '@ionic/angular';
// import { SplashScreen } from '@ionic-native/splash-screen';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

// import { Push, PushObject, PushOptions } from '@ionic-native/push/ngx';
import { Push } from '@ionic-native/push/ngx';

import * as firebase from "firebase/app";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    options: string;

    loadstopEvents: any;

    JSON: any;
    browser: any;

    doDebug: boolean;//for debug

    browserLoopSetTimeout: any;
    browserLoopIsActive: boolean;

    webTimestamp: string;//for debug
    nativeTimestamp: string;//for debug

    loggingIn: boolean;
    loginCount: number;//for debug
    unsubscribeOnAuthStateChanged: any;

    users: any;
    fbUser: any;

    device: any;

    webNav: any;
    nativeAppModeActivated: boolean;

    errors: any[];

    fbUpdates: any[];

    browserLoopCount: number;

    showDropdown: boolean;
    arrowDirection: string;
    errorTitle: string;
    errorDescription: string;

    browserUrl: string;

    constructor(public platform: Platform, private iab: InAppBrowser, private ref: ChangeDetectorRef, 
        private http: HttpClient, private ngZone: NgZone, public push: Push) {
        this.JSON = JSON;
        this.http = http;

        this.loadstopEvents = [];
    }

    toggleDropdown(){
        this.showDropdown = !this.showDropdown;
    }

    ngOnInit() {
        this.showDropdown = false;
        this.errorTitle = 'Unexpected error';
        this.errorDescription = "Please check your internet connection";

        // this.doDebug = true;

        this.errors = [];
        this.fbUpdates = [];
        this.users = [];
        this.loginCount = 0;

        this.platform.ready().then(() => {
            if (this.platform.is('cordova')) {
                this.setupPush();
            }

            this.unsubscribeOnAuthStateChanged = firebase.auth().onAuthStateChanged(user => {
                this.ngZone.run(() => {
                    if (user) {
                        this.loginCount += 1;
                        this.users = [];

                        this.fbUser = user;
                        this.doDebug && this.toast('native logged in: ' + this.fbUser.uid + " | " + this.fbUser.email);

                        firebase.database().ref("EmailsRef/" + this.encodeKey(this.fbUser.email)).once('value').then(emailsRef => {
                            this.users = [];
                            if (emailsRef.exists() && emailsRef.val().Networks) {
                                for (var key in emailsRef.val().Networks) {
                                    if (emailsRef.val().Networks.hasOwnProperty(key)) {
                                        // do stuff
                                        this.users.push({key: emailsRef.val().Networks[key], networkKey: key});
                                    }
                                }
                            }
                      }).then(() => {
                            this.doDebug && this.toast(this.users);

                            this.setDeviceUserPairing();
                      });
                    } else {
                        this.doDebug && this.toast("native logged out");
                        this.fbUser = null;
                        this.users = [];
                    }
                
                    this.startBrowser();
                });
            });
        });
    }

    toggleDebug() {
        this.doDebug = !this.doDebug;
    }

    startBrowser() {
        if (!this.browser) {
            this.browserUrl = 'https://smpltalk.com/#/';

            this.options = '';

            var optionAry = [];

            optionAry.push("disallowoverscroll=yes");//(iOS) Turns on/off the UIWebViewBounce property.
            optionAry.push("keyboardDisplayRequiresUserAction=no");// (iOS) Should take care of ios not allowing focus on inputs
            // optionAry.push("hidden=yes");

            if (this.doDebug) {
                // optionAry.push("toolbar=yes");// (iOS) Should be testing only
                optionAry.push("location=yes"); // Should be testing only
                optionAry.push("clearcache=yes");// Should be testing only
                optionAry.push("clearsessioncache=yes");// Should be testing only
            } else {
                optionAry.push("toolbar=no");// (iOS) Should be testing only
                optionAry.push("location=no"); // Should be testing only
            }

            for (var i = 0; i < optionAry.length; i++) {
                this.options += optionAry[i];

                if (i !== optionAry.length - 1) {
                    this.options += ",";
                }
            }

            if (this.platform.is('cordova')) {
                this.browser = this.browser || this.iab.create("https://smpltalk.com/#/", '_blank', this.options);

                // this.browser.on("loadstart").subscribe(event => {
                //   this.browser.executeScript({ code: "alert('loadstart');" });
                // });

                // this.browser.on("loadstop").subscribe(event => {
                //   this.browser.executeScript({ code: "alert('loadstop');" });
                // });

                this.browser.on("loaderror").subscribe(event => {
                this.ngZone.run(() => {
                // this.doDebug = true;
                this.browser.hide();
                // this.errors.push(event);
                this.errors.push({key: 'browser loaderror event', error: event});
                });
                });

                this.browser.on("exit").subscribe(event => {
                this.ngZone.run(() => {
                // this.errors.push(event);
                this.errors.push({key: 'browser exit event', error: event});

                this.browser = null;
                });
                });

                this.browser.on("loadstart").subscribe(event => {
                // this.ngZone.run(() => {
                //   // this.browser.executeScript({ code: "localStorage.setItem('nativeAppMode', 'moo');" });
                //   // this.browser.executeScript({code: 'window.my.activateAppMode.publicActivateAppModeFunc();'});

                //   // this.clearBrowserLoop();

                //   // this.loadstopEvents.push(event);
                //   if (!this.browserLoopIsActive) {
                //     this.browserLoopIsActive = true;
                //     this.browserLoopFunction(100);
                //   }
                // });
                });

                this.browser.on("loadstop").subscribe(event => {
                this.doDebug && this.toast("loadstop worked", "bottom");
                this.ngZone.run(() => {
                // this.splashScreen.hide();
                // this.browser.show();

                if (!this.browserLoopIsActive) {
                this.browserLoopIsActive = true;
                this.browserLoopFunction(100);
                }
                });
                // this.browser.executeScript({
                //   code: "localStorage.setItem('nativeAppTime', '" + this.getDateString() + "');"
                // }, values => {
                //   this.ngZone.run(() => {
                //     var hideWebWrapper = values[0];

                //     if (hideWebWrapper) {
                //       this.browser.executeScript({ code: "localStorage.setItem('hideWebApp', '');" });
                //       this.browser.hide();
                //       this.ref.detectChanges();
                //     }
                //   });
                // });
                });
            }
        }
    }

    showBrowser() {
      this.browser && this.browser.show();
    }

    browserLoopFunction(delay?: number) {
      this.ngZone.run(() => {
        this.doDebug && this.toast('browserLoopFunction');

        this.browserLoopCount = (this.browserLoopCount || 0) + 1;

        this.nativeTimestamp = this.getDateString();
        return this.browserActivateNativeAppMode().then(values => {
          // nothing
        }).then(() => {
          return this.browserLogoutOfNativeApp().then(values => {
            // nothing
          });
        }).then(() => {
          return this.browserGetFirebaseIdToken().then(values => {
            // nothing
          });
        }).then(() => {
          return this.browserSetNav().then(values => {
            // nothing
          });
        }).then(() => {
          return this.browserTest().then(values => {
            if (values && values.length && values[0]) {
              return this.browser.executeScript({
                code: "window.my && window.my.activateAppMode && window.my.activateAppMode.publicDebugFunc && window.my.activateAppMode.publicDebugFunc(" + JSON.stringify({key: 'test2', value: this.getDateString() + ' test2' }) + ");"
              });
            }
          });
        }).then(() => {
          if (delay) {
            this.browserLoopSetTimeout = setTimeout(() => {
              this.ngZone.run(() => {
                this.browserLoopFunction(delay);
              });
            }, delay);
          }
        }).catch(error => {
          this.doDebug && this.toast('Unexpected error during browser loop');
          // this.errors.push(error);
          this.errors.push({key: 'browser loop error', error: error});

          if (delay) {
            this.browserLoopSetTimeout = setTimeout(() => {
              this.ngZone.run(() => {
                this.browserLoopFunction(delay);
              });
            }, delay);
          }
        });
      });
    }

    clearBrowserLoop() {
      if (this.browserLoopIsActive) {
        this.browserLoopIsActive = false;
        clearTimeout(this.browserLoopSetTimeout);
      }
    }

    browserTest() {
      if (this.doDebug && this.browser) {
        return this.browser.executeScript({
          code: "window.my && window.my.activateAppMode && window.my.activateAppMode.publicDebugFunc && window.my.activateAppMode.publicDebugFunc(" + JSON.stringify({key: 'test', value: this.getDateString() + ' test'}) + ");"
        }).then(values => {
          this.webTimestamp = this.getDateString();
          return values;
        }).catch(error => {
          // this.errors.push(error);
          this.errors.push({key: 'browser test', error: error});
          return null;
        });
      } else {
        return Promise.resolve(null);
      }
    }

    browserActivateNativeAppMode() {
      this.doDebug && this.toast('browserActivateNativeAppMode');
      if (this.browser && !this.nativeAppModeActivated) {
        return this.browser.executeScript({
          code: "window.my && window.my.activateAppMode && window.my.activateAppMode.publicActivateAppModeFunc && window.my.activateAppMode.publicActivateAppModeFunc();"
        }).then(values => {
          this.doDebug && this.toast("native app mode activated");
          this.nativeAppModeActivated = true;
        }).catch(error => {
          // this.errors.push(error);
          this.errors.push({key: 'browser active native app mode', error: error});

          return null;
        });
      } else {
        return Promise.resolve(null);
      }
    }

    browserLogoutOfNativeApp() {
      if (this.browser && this.nativeAppModeActivated) {
        return this.browser.executeScript({
          code: "localStorage.getItem('logoutOfNativeApp')"
        }).then(values => {
          if (values && values.length && values[0]) {
            return this.browser.executeScript({ code: "localStorage.setItem('logoutOfNativeApp', '');" }).then(() => {
              this.users = [];
              return this.setDeviceUserPairing().then(result => {
                // handle firebaseSignOut here
              }).then(() => {
                return this.firebaseSignOut().then(result => {
                  // handle firebaseSignOut here
                });
              }).then(() => {
                if (this.doDebug) {
                  return this.browser.executeScript({
                    code: "window.my && window.my.activateAppMode && window.my.activateAppMode.publicDebugFunc && window.my.activateAppMode.publicDebugFunc(" + JSON.stringify({key: 'nativeAuthOut', value: this.getDateString() + ' native signed out at' }) + ");"
                  });
                } else {
                  return null;
                }
              });;
            });
          }
        }).catch(error => {
          // this.errors.push(error);
          this.errors.push({key: 'browser log out', error: error});

          return null;
        });
      } else {
        return Promise.resolve(null);
      }
    }

    browserGetFirebaseIdToken() {
      function b64DecodeUnicode(str) {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
      }

      if (this.browser && this.nativeAppModeActivated) {
        return this.browser.executeScript({
          code: "localStorage.getItem('firebase_id_token_output')"
        }).then(values => {
          var firebase_id_token = values && values.length && values[0];
          if (firebase_id_token) {
            if (this.loggingIn) {
              return this.logUserOutOfBrowser();
            } else {
              // Parse the ID token.
              const payload = JSON.parse(b64DecodeUnicode(firebase_id_token.split('.')[1]));

              if (this.fbUser && this.fbUser.email && this.fbUser.email === payload.email) {
                // The current user is the same user that just logged in, so no need to reauth
                this.doDebug && this.toast("user was already logged in native");
              } else {
                this.loggingIn = true;

                this.exchangeIDTokenForCustToken(firebase_id_token).then(data => {
                  return this.ngZone.run(() => {
                    return this.signInWithCustomToken(data).then(() => {
                        this.loggingIn = false;
                    });
                  });
                }).catch(error => {
                    this.doDebug && this.toast("Error occurred when attempting to exchange firebase ID token for custom auth token.");
                    this.loggingIn = false;
                });

                // var exchangeIDTokenForCustTokenSubscription = this.exchangeIDTokenForCustToken(firebase_id_token).subscribe(data => {
                //   this.ngZone.run(() => {
                //     this.signInWithCustomToken(data);
                //   });
                // }, error => {
                //   this.ngZone.run(() => {
                //     this.doDebug && this.toast("Error occurred when attempting to exchange firebase ID token for custom auth token.");
                //     exchangeIDTokenForCustTokenSubscription.unsubscribe();
                //     this.loggingIn = false;
                //   });
                // }, () => {
                //   this.ngZone.run(() => {
                //     exchangeIDTokenForCustTokenSubscription.unsubscribe();
                //     this.loggingIn = false;
                //   });
                // });
              }

              return this.browser.executeScript({ code: "localStorage.setItem('firebase_id_token_output', '');" }).then(() => {
                if (this.doDebug) {
                  return this.browser.executeScript({
                    code: "window.my && window.my.activateAppMode && window.my.activateAppMode.publicDebugFunc && window.my.activateAppMode.publicDebugFunc(" + JSON.stringify({key: 'nativeAuthIn', value: this.getDateString() + ' native signed in at'}) + ");"
                  });
                } else {
                  return null;
                }
              });
            }
          }
        }).catch(error => {
          // this.errors.push(error);
          this.errors.push({key: 'get firebase id token', error: error});

          return null;
        });
      } else {
        return Promise.resolve(null);
      }
    }

    browserSetNav() {
      this.doDebug && this.toast('browserSetNav');
      if (this.browser && this.webNav) {
        return this.browser.executeScript({
          code: "window.my && window.my.activateAppMode && window.my.activateAppMode.publicWebNavFunc && window.my.activateAppMode.publicWebNavFunc(" + JSON.stringify(this.webNav) + ");"
        }).then(values => {
          if (this.webNav.navType === 'post') {
            if (this.webNav.postKey && this.webNav.groupKey) {
              this.browserUrl = 'https://smpltalk.com/#/content/post/' + this.webNav.groupkey + '/' + this.webNav.postKey;
            } else {
              this.browserUrl = 'https://smpltalk.com/';
            }
          }
          this.doDebug && this.toast("browser set nav");
          this.webNav = null;
        }).catch(error => {
          // this.errors.push(error);
          this.errors.push({key: 'browser set nav', error: error});
          this.webNav = null;

          return null;
        });
      } else {
        return Promise.resolve(null);
      }
    }

    logUserOutOfBrowser() {
      if (this.browser) {
        return this.browser.executeScript({
          code: "localStorage.setItem('shouldLogout', 'moo');"
        }).then(() => {
          if (this.doDebug) {
            return this.browser.executeScript({
              code: 'window.my && window.my.activateAppMode && window.my.activateAppMode.publicShouldLogoutFunc && window.my.activateAppMode.publicShouldLogoutFunc();'
            });  
          } else {
            return null;
          }
        }).catch(error => {
          // this.errors.push(error);
          this.errors.push({key: 'log user out of browser', error: error});

          return null;
        });
      } else {
        return Promise.resolve(null);
      }
    }

    exchangeIDTokenForCustToken(iDToken: any) {
        var url = "https://us-central1-ourg-2c585.cloudfunctions.net/g41-app/exchangeIDTokenForCustToken";
        var headers = new HttpHeaders();

        headers = headers.append('Authorization', 'Bearer ' + iDToken);

        return this.http.get(url, {responseType: 'text'}).toPromise().then(res => {
            var data = res as any;
            return data;
        }).catch(error => {
            // Add to error listing
            console.error(error);
            throw error;
        });
    }

    signInWithCustomToken(token: any) {
      return firebase.auth().signInWithCustomToken(token).then(user => {
        // console.log("User with user id: " + user.uid + " created/logged in.");
      }).catch(error => {
        // Handle Errors here.
        var errorMessage: string;

        if (error.code) {
          if (error.code === 'auth/custom-token-mismatch') {
            errorMessage = "Token is for a different App";
          } else if (error.code === 'auth/invalid-custom-token') {
            errorMessage = "Token format is incorrect";
          }
        }

        errorMessage = errorMessage || error.message || error;

        // console.log(errorMessage);
        this.loggingIn = false;
        this.doDebug && this.toast(errorMessage);

        // this.errors.push(error);
        this.errors.push({key: 'use custom token', error: error});

        return this.logUserOutOfBrowser();
      });
    }

    firebaseSignOut() {
      return firebase.auth().signOut().then(() => {
      }, error => {
        // this.errors.push(error);
          this.errors.push({key: 'firebase sign out', error: error});
      });
    }

    setupPush() {
      this.doDebug && this.toast("setupPush");
      // source: https://www.youtube.com/watch?v=sUjQ3G17T80

      // to check if we have permission
      this.push.hasPermission().then((res: any) => {
        if (res.isEnabled) {
          this.doDebug && this.toast('We have permission to send push notifications');
        } else {
          this.doDebug && this.toast('We do not have permission to send push notifications');
        }
      }).catch(error => {
        this.errors.push({key: 'setupPush', error: error});
      });

      // to initialize push notifications
      // const options: PushOptions = {
      const options: any = {
         android: {
           //senderID: XXXX
           icon: 'ic_android_generated',
           iconColor: '#1DAED9',
           vibrate: 'true',
           // clearBadge: 'true',
           //clearNotifications: 'true',
           //forceShow: 'true',
           //messageKey: '',
           //titleKey: '',
           alert: 'true',
           // badge: true,
           sound: 'true'
         },
         ios: {
             alert: 'true',
             badge: true,
             sound: 'true',
             clearBadge: true
         },
         windows: {},
         browser: {
            pushServiceURL: 'http://push.api.phonegap.com/v1/push'
         }
      };
      
      // const pushObject: PushObject = this.push.init(options);
      const pushObject = this.push.init(options);

      pushObject.on('notification').subscribe((notification: any) => {
        this.ngZone.run(() => {
          this.doDebug && this.toast('Received a notification' + JSON.stringify(notification));
          // foreground

          // TODO: handle notification
          if (notification.additionalData.foreground) {
            
          } else {
            var navType = notification.additionalData.navType;
            var postKey = notification.additionalData.postKey;
            var groupKey = notification.additionalData.groupKey;
            var networkKey = notification.additionalData.networkKey;

            this.webNav = {navType: navType, postKey: postKey, groupKey: groupKey, networkKey: networkKey};
            
            this.doDebug && this.browser && this.browser.executeScript({
              code: "window.my && window.my.activateAppMode && window.my.activateAppMode.publicDebugFunc && window.my.activateAppMode.publicDebugFunc(" + JSON.stringify({key: 'notification', value: notification}) + ");"
            });
          }

          //collapse_key  string  (optional)
          //coldstart  boolean  (optional)
          //from  string  (optional)
          //notId
        });
      });

      pushObject.on('registration').subscribe((registration: any) => {
        this.ngZone.run(() => {
          this.doDebug && this.toast('Device registered' + JSON.stringify(registration));

          // TODO: Save deviceID to user's account
          this.device = registration;

          this.setDeviceUserPairing();
        });
      });

      pushObject.on('error').subscribe(error => {
        this.ngZone.run(() => {
          this.doDebug && this.toast('Error with Push plugin' + JSON.stringify(error));
          // TODO: log error
          this.errors.push({key: 'push subscribe', error: error});
        });
      });
    }

    setDeviceUserPairing() {
      if (!this.fbUser || !this.device || !this.device.registrationId) {
        return Promise.resolve(null);
      }

      this.doDebug && this.toast("pair device and user");
      
      var updates = {};

      var pushUserPath = 'Users';
      var pushDevicePath = 'Devices';

      return firebase.database().ref('PushNotifications/Devices/' + this.device.registrationId + '/Users').once('value').then(userSnapshots => {
        userSnapshots.forEach(userSnapshot => {
          var match = false;

          if (this.users) {
            for (var i = 0; i < this.users.length; i++) {
              if (this.users[i].key === userSnapshot.key) {
                match = true;
                break;
              }
            }
          }

          if (!match) {
            // removeUserKeys.push(userSnapshot.key);
            updates[pushUserPath + '/' + userSnapshot.key + '/Devices/' + this.device.registrationId] = null;
            updates[pushDevicePath + '/' + this.device.registrationId + '/Users/' + userSnapshot.key] = null;
          }
        })
      }).then(() => {
        for (var i = 0; i < this.users.length; i++) {
          var user = this.users[i];
          var now = Date.now();

          updates[pushUserPath + '/' + user.key + '/Devices/' + this.device.registrationId] = now;
          updates[pushDevicePath + '/' + this.device.registrationId + '/Users/' + user.key] = now;
        }

        this.doDebug && this.toast(JSON.stringify(updates));
        this.fbUpdates.push(updates);

        return firebase.database().ref('PushNotifications/').update(updates).then(() => {
          this.doDebug && this.toast("updated pushNotifications in database");
        }).catch(error => {
          this.doDebug && this.toast(error);
          this.errors.push({key: 'fb notifications update', error: error});
        }).then(() => {
          if (this.doDebug) {
            return this.browser.executeScript({
              code: "window.my && window.my.activateAppMode && window.my.activateAppMode.publicDebugFunc && window.my.activateAppMode.publicDebugFunc(" + JSON.stringify({key: 'setDeviceUserPairing', value: this.getDateString() + ' device user pairing'}) + ");"
            });
          } else {
            return null;
          }
        });
      }).catch(error => {
        this.doDebug && this.toast(error);
        this.errors.push({key: 'push devices update', error: error});
        return null;
      });
    }

    toast(message: any, position?: string) {
      // TODO: add messages to an array?
      return;
      // message = JSON.stringify(message);

      // let toast = this.toastCtrl.create({
      //   message: message,
      //   duration: 3000,
      //   position: position || 'top'
      // });

      // // toast.onDidDismiss(() => {
      // //   console.log('Dismissed toast');
      // // });

      // toast.present();
    }

    getDateString(timestamp?: number) {
      var u;

      if (timestamp) {
        u = new Date(timestamp);
      } else {
        u = new Date();
      }

      // source: https://stackoverflow.com/questions/19485353/function-to-convert-timestamp-to-human-date-in-javascript
      // ex: 2016-04-30 08:36:26.000
      return u.getUTCFullYear() +
        '-' + ('0' + u.getUTCMonth()).slice(-2) +
        '-' + ('0' + u.getUTCDate()).slice(-2) + 
        ' ' + ('0' + u.getUTCHours()).slice(-2) +
        ':' + ('0' + u.getUTCMinutes()).slice(-2) +
        ':' + ('0' + u.getUTCSeconds()).slice(-2) +
        '.' + (u.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
    }

    // encodeKey(str: string) {
  //  return str.replace(/\_/g, '_U').replace(/\./g, '_P').replace(/\$/g, '_D').replace(/\[/g, '_O').replace(/\]/g, '_C').replace(/\#/g, '_H').replace(/\//g, '_S');
  // }

  // decodeKey(str: string) {
  //  return str.replace(/\_P/g, '.').replace(/\_D/g, '$').replace(/\_O/g, '[').replace(/\_C/g, ']').replace(/\_H/g, '#').replace(/\_S/g, '/').replace(/\_\U/g, '_');
  // }

  encodeKey(str: string) {
    return str.replace(/\%/g, '%25').replace(/\./g, '%2E').replace(/\$/g, '%24').replace(/\[/g, '%5B').replace(/\]/g, '%5D').replace(/\#/g, '%23').replace(/\//g, '%2F');
  }

  decodeKey(str: string) {
    return str.replace(/\%2E/g, '.').replace(/\%24/g, '$').replace(/\%5B/g, '[').replace(/\%5D/g, ']').replace(/\%23/g, '#').replace(/\%2F/g, '/').replace(/\%25/g, '%');
  }

  pushError(error) {
    if (error === -1200 || (error && error.code === -1200) || (error && error.error && error.error.code === -1200)) {
      this.errorTitle = 'Error -1200';
    }
    this.errors.push(error);
  }
}
