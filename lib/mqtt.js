'use strict'

const log = require(`:lib/log`)
const mqtt = require('mqtt')

const factory = {}

factory.reset = (broadcaster) => {
    broadcaster.connected = false
    broadcaster.connecting = false
}

factory.start = (broadcaster, target, server) => {
    // log.debug(`Start MQTT for broadcaster ${JSON.stringify(broadcaster)} and target ${JSON.stringify(target)}`)
    if (server) {
        broadcaster.server = server
    }
    if (broadcaster.connected) {
        return `connected`
    } else {
        if (broadcaster.connecting) {
            return `connecting`
        }
        broadcaster.connecting = true
        const broker = {
            servers: [{
                // protocop: target.protocol,
                host: target.host,
                port: target.port
            }],
        }
        if (target.username && target.username !== ``) {
            broker.username = target.username
        }
        if (target.password && target.password !== ``) {
            broker.password = target.password
        }
        broadcaster.mqtt = mqtt.connect(broker)
        broadcaster.mqtt.on('connect', () => {
            broadcaster.connected = true
            broadcaster.connecting = false
            log(`Connected to MQTT "${target.name}"`)
        })
        broadcaster.mqtt.on('error', (error) => {
            if (broadcaster.server) {
                broadcaster.server.error({
                    error: error.message,
                    target,
                })
            }
        })
        return `connect`
    }
}

factory.stop = async (broadcaster, target) => {
    return new Promise((resolve, reject) => {
        if (broadcaster.mqtt === undefined) {
            factory.reset(broadcaster)
            resolve()
            return
        }
        if (!broadcaster.connected && !broadcaster.connecting) {
            factory.reset(broadcaster)
            resolve()
            return
        }
        broadcaster.mqtt.end(err => {
            if (err) {
                log.error(err)
                reject(err)
            } else {
                log(`MQTT "${target.name}" disconnected`)
                resolve()
            }
            factory.reset(broadcaster)
        })
    })
}

module.exports = factory
