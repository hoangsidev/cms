$(function () {
    Vue.directive('focus', {
        inserted: function (el) { el.focus() }
    });

    var create_user = new Vue({
            el: '#create_user',
            data: {
                username: null,
                email: null,
                password: null,
                confirm_password: null,
                errors: [],
                err_exist_username: null,
                err_exist_email: null,
            },
            methods: {
                signup: function () {
                    this.errors = [];
                    if (!this.username) {
                        this.errors.push("Username required.")
                    } else if (!this.valid_username(this.username)) {
                        this.errors.push("Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.");
                    }
                    if (!this.email) {
                        this.errors.push("Email required.");
                    } else if (!this.valid_email(this.email)) {
                        this.errors.push("Valid email required.");
                    }
                    if (!this.password) {
                        this.errors.push("Password required.");
                    } else if (!this.valid_password(this.password)) {
                        this.errors.push("Password must contain at least one number and one uppercase and lowercase letter, and at least 6 or more characters.");
                    }
                    if (!this.confirm_password) {
                        this.errors.push("Confirm password required.");
                    } else if (this.confirm_password != this.password) {
                        this.errors.push("Password confirmation doesn't match the password.");
                    }
                    if (!this.errors.length && !this.err_exist_username && !this.err_exist_email) this.$refs.form.submit();
                },
                valid_username: function (username) {
                    var re = /^[a-zA-Z0-9]+$/;
                    return re.test(username);
                },
                valid_email: function (email) {
                    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    return re.test(email);
                },
                valid_password: function (password) {
                    var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
                    return re.test(password);
                },
                exist_username: function () {
                    this.err_exist_username = null;
                    if (this.username) { socket.emit('guest_username', this.username); }
                },
                exist_email: function () {
                    this.err_exist_email = null;
                    if (this.email) { socket.emit('guest_email', this.email); }
                }
            }
        });
        socket.on('ser_exist_username', () => {
            create_user.err_exist_username = "Username is already taken.";
        });
        socket.on('ser_exist_email', () => {
            create_user.err_exist_email = "Email is already taken.";
        });


    });
    