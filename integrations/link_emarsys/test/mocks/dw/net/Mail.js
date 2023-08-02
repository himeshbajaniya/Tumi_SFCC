class Mail {
    addTo(mailTo) {
        this.to = mailTo;
        return this;
    }
    setFrom(mailFrom) {
        this.from = mailFrom;
        return this;
    }
    setSubject(mailSubject) {
        this.subject = mailSubject;
        return this;
    }
    setContent(content) {
        return true;
    }
    send() {
        return true;
    }
}

module.exports = Mail;