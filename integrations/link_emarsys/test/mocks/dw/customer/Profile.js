class Profile {
    constructor() {
        this.addressBook = { 
            preferredAddress: {
                address1: '735 E Fillmore St',
                city: 'Phoenix',
                countryCode: {displayValue: 'us'},
                firstName: 'Mali',
                fullName: '',
                lastName: 'Ender',
                phone: '9234567890',
                postalCode: '85001',
                secondName: '',
                stateCode: 'AZ'
            }
        };
        this.email = 'marsik.tagManager@gmail.com'
        this.addresses = [];
        this.gender = {
            value: '1',
            displayValue: 'male'
        };
        this.custom = {
            color:'black',
            size:'31'
        }
    }
}

module.exports = Profile;