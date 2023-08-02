'use strict';

module.exports = {
    getFTPService: function(serviceID) {
        return {
            uploadFiles: function (targetFolder, file, archiveFolder,recursive) {
                return {
                    status: 'OK',
                    object: JSON.stringify({data:[]})
                }
            }
        }
    }
};