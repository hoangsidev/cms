var express = require('express'),
    session = require('cookie-session'),
    formidable = require('formidable'),
    fs = require('fs'),
    path = require('path'),
    md5 = require('md5'),
    body_parser = require('body-parser'),
    slugify = require('slugify'),
    nodemailer = require('nodemailer'),
    method_override = require('method-override');

var config = {
    app: () => {
        var app = express();
        app.set('port', 3000);
        return app;
    },
    express: () => {
        return express;
    },
    session: () => {
        return session;
    },
    get_admin_url: () => {
        return 'http://127.0.0.1:3000/backend';
    },
    get_site_url: () => {
        return 'http://127.0.0.1:3000';
    },
    get_site_name: () => {
        return 'HoangSi';
    },
    get_admin_email: () => {
        return 'it.hoangsi@gmail.com';
    },
    fs: () => {
        return fs;
    },
    formidable: () => {
        return formidable;
    },
    path: () => {
        return path;
    },
    md5: () => {
        return md5;
    },
    body_parser: () => {
        return body_parser;
    },
    slugify: () => {
        return slugify;
    },
    nodemailer: () => {
        return nodemailer;
    },
    method_override: () => {
        return method_override;
    }
}

module.exports = config;