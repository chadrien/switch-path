(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var util_1 = require("./util");
function switchPathInputGuard(path, routes) {
    if (!util_1.isPattern(path)) {
        throw new Error("First parameter to switchPath must be a route path.");
    }
    if (!util_1.isRouteDefinition(routes)) {
        throw new Error("Second parameter to switchPath must be an object " +
            "containing route patterns.");
    }
}
function validatePath(sourcePath, matchedPath) {
    var sourceParts = util_1.splitPath(sourcePath);
    var matchedParts = util_1.splitPath(matchedPath);
    for (var i = 0; i < matchedParts.length; ++i) {
        if (matchedParts[i] !== sourceParts[i]) {
            return null;
        }
    }
    return "/" + util_1.extractPartial(sourcePath, matchedPath);
}
function betterMatch(candidate, reference) {
    if (!util_1.isNotNull(candidate)) {
        return false;
    }
    if (!util_1.isNotNull(reference)) {
        return true;
    }
    if (!validatePath(candidate, reference)) {
        return false;
    }
    return candidate.length >= reference.length;
}
function matchesWithParams(sourcePath, pattern) {
    var sourceParts = util_1.splitPath(sourcePath);
    var patternParts = util_1.splitPath(pattern);
    var params = patternParts
        .map(function (part, i) { return util_1.isParam(part) ? sourceParts[i] : null; })
        .filter(util_1.isNotNull);
    var matched = patternParts
        .every(function (part, i) { return util_1.isParam(part) || part === sourceParts[i]; });
    return matched ? params : [];
}
function getParamFnValue(paramFn, params) {
    var _paramFn = util_1.isRouteDefinition(paramFn) ? paramFn["/"] : paramFn;
    return typeof _paramFn === "function" ? _paramFn.apply(void 0, params) : _paramFn;
}
function validate(_a) {
    var sourcePath = _a.sourcePath, matchedPath = _a.matchedPath, matchedValue = _a.matchedValue, routes = _a.routes;
    var path = matchedPath ? validatePath(sourcePath, matchedPath) : null;
    var value = matchedValue;
    if (!path) {
        path = routes["*"] ? sourcePath : null;
        value = path ? routes["*"] : null;
    }
    return { path: path, value: value };
}
function switchPath(sourcePath, routes) {
    switchPathInputGuard(sourcePath, routes);
    var matchedPath = null;
    var matchedValue = null;
    util_1.traverseRoutes(routes, function matchPattern(pattern) {
        if (sourcePath.search(pattern) === 0 && betterMatch(pattern, matchedPath)) {
            matchedPath = pattern;
            matchedValue = routes[pattern];
        }
        var params = matchesWithParams(sourcePath, pattern).filter(Boolean);
        if (params.length > 0 && betterMatch(sourcePath, matchedPath)) {
            matchedPath = util_1.extractPartial(sourcePath, pattern);
            matchedValue = getParamFnValue(routes[pattern], params);
        }
        if (util_1.isRouteDefinition(routes[pattern]) && params.length === 0) {
            if (sourcePath !== "/") {
                var child = switchPath(util_1.unprefixed(sourcePath, pattern) || "/", routes[pattern]);
                var nestedPath = pattern + child.path;
                if (child.path !== null &&
                    betterMatch(nestedPath, matchedPath)) {
                    matchedPath = nestedPath;
                    matchedValue = child.value;
                }
            }
        }
    });
    return validate({ sourcePath: sourcePath, matchedPath: matchedPath, matchedValue: matchedValue, routes: routes });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = switchPath;

},{"./util":2}],2:[function(require,module,exports){
"use strict";
function isPattern(candidate) {
    return candidate.charAt(0) === "/" || candidate === "*";
}
exports.isPattern = isPattern;
function isRouteDefinition(candidate) {
    return !candidate || typeof candidate !== "object" ?
        false : isPattern(Object.keys(candidate)[0]);
}
exports.isRouteDefinition = isRouteDefinition;
function traverseRoutes(routes, callback) {
    var keys = Object.keys(routes);
    for (var i = 0; i < keys.length; ++i) {
        var pattern = keys[i];
        if (pattern === "*")
            continue;
        callback(pattern);
    }
}
exports.traverseRoutes = traverseRoutes;
function isNotNull(candidate) {
    return candidate !== null;
}
exports.isNotNull = isNotNull;
function splitPath(path) {
    return path.split("/").filter(function (s) { return !!s; });
}
exports.splitPath = splitPath;
function isParam(candidate) {
    return candidate.match(/:\w+/) !== null;
}
exports.isParam = isParam;
function extractPartial(sourcePath, pattern) {
    var patternParts = splitPath(pattern);
    var sourceParts = splitPath(sourcePath);
    var matchedParts = [];
    for (var i = 0; i < patternParts.length; ++i) {
        matchedParts.push(sourceParts[i]);
    }
    return matchedParts.filter(isNotNull).join("/");
}
exports.extractPartial = extractPartial;
function unprefixed(fullString, prefix) {
    return fullString.split(prefix)[1];
}
exports.unprefixed = unprefixed;

},{}]},{},[1]);
