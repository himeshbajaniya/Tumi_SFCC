'use strict';

var secret = repairsAndServicesDetails.repairSecretKey;
var rlSite = repairsAndServicesDetails.requestRepairURL;
var rlCheckStatus = repairsAndServicesDetails.checkRepairSatusURL;
var encrypted;

function formatDt() {
	var t = new Date,
		e = "" + (t.getUTCMonth() + 1),
		n = "" + t.getUTCDate(),
		r = t.getUTCFullYear(),
		o = "" + t.getUTCHours(),
		a = "" + t.getUTCMinutes(),
		c = "" + t.getUTCSeconds();
	return e.length < 2 && (e = "0" + e), n.length < 2 && (n = "0" + n), o.length < 2 && (o = "0" + o), a.length < 2 && (a = "0" + a), c.length < 2 && (c = "0" + c), [e, n, r, o, a, c].join("");
}

module.exports = {
	repairAndService: function () {
		$(document).ready(function() {
			$(document).on("click", ".request-a-repair", function(t) {
				t.preventDefault();
				var e = 9e17 * Math.random() + 1e17,
					n = formatDt(),
					r = "t=null&s=null&p=null&c=null&a=" + (e.toString() + "" + n);
				encrypted = CryptoJS.AES.encrypt(r, secret, {
					mode: CryptoJS.mode.ECB,
					padding: CryptoJS.pad.Pkcs7
				}).toString();
				window.location.href = rlSite + "/?param=" + encrypted;
			});
			$(document).on("click", ".check-status", function(t) {
				t.preventDefault();
				var e = 9e17 * Math.random() + 1e17,
					n = formatDt(),
					r = "a=" + (e.toString() + "" + n);
				encrypted = CryptoJS.AES.encrypt(r, secret, {
					mode: CryptoJS.mode.ECB,
					padding: CryptoJS.pad.Pkcs7
				}).toString();
				window.location.href = rlCheckStatus + "?param=" + encrypted;
			});
		});
	}
};