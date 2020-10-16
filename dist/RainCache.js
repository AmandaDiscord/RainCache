"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const events_1 = require("events");
const EventProcessor_1 = __importDefault(require("./EventProcessor"));
const RedisStorageEngine_1 = __importDefault(require("./storageEngine/RedisStorageEngine"));
const AmqpConnector_1 = __importDefault(require("./connector/AmqpConnector"));
const DirectConnector_1 = __importDefault(require("./connector/DirectConnector"));
const GuildCache_1 = __importDefault(require("./cache/GuildCache"));
const ChannelCache_1 = __importDefault(require("./cache/ChannelCache"));
const ChannelMapCache_1 = __importDefault(require("./cache/ChannelMapCache"));
const MemberCache_1 = __importDefault(require("./cache/MemberCache"));
const UserCache_1 = __importDefault(require("./cache/UserCache"));
const RoleCache_1 = __importDefault(require("./cache/RoleCache"));
const EmojiCache_1 = __importDefault(require("./cache/EmojiCache"));
const PresenceCache_1 = __importDefault(require("./cache/PresenceCache"));
const PermissionOverwriteCache_1 = __importDefault(require("./cache/PermissionOverwriteCache"));
const VoiceStateCache_1 = __importDefault(require("./cache/VoiceStateCache"));
class RainCache extends events_1.EventEmitter {
    constructor(options, inboundConnector, outboundConnector) {
        super();
        if (!options.storage) {
            throw new Error("No storage engines were passed");
        }
        if (!options.cacheClasses) {
            options.cacheClasses = {
                guild: GuildCache_1.default,
                channel: ChannelCache_1.default,
                channelMap: ChannelMapCache_1.default,
                member: MemberCache_1.default,
                user: UserCache_1.default,
                role: RoleCache_1.default,
                emoji: EmojiCache_1.default,
                presence: PresenceCache_1.default,
                permOverwrite: PermissionOverwriteCache_1.default,
                voiceState: VoiceStateCache_1.default
            };
        }
        if (!options.storage.default) {
        }
        if (!options.disabledEvents) {
            options.disabledEvents = {};
        }
        this.options = options;
        this.ready = false;
        this.inbound = inboundConnector;
        this.outbound = outboundConnector;
    }
    static get Connectors() {
        return {
            AmqpConnector: AmqpConnector_1.default,
            DirectConnector: DirectConnector_1.default
        };
    }
    static get Engines() {
        return {
            RedisStorageEngine: RedisStorageEngine_1.default
        };
    }
    async initialize() {
        try {
            for (const engine in this.options.storage) {
                if (this.options.storage.hasOwnProperty(engine)) {
                    if (!this.options.storage[engine].ready) {
                        await this.options.storage[engine].initialize();
                    }
                }
            }
        }
        catch (e) {
            throw new Error("Failed to initialize storage engines");
        }
        this.cache = this._createCaches(this.options.storage, this.options.cacheClasses);
        Object.assign(this, this.cache);
        this.eventProcessor = new EventProcessor_1.default({
            disabledEvents: this.options.disabledEvents,
            cache: {
                guild: this.cache.guild,
                channel: this.cache.channel,
                channelMap: this.cache.channelMap,
                member: this.cache.member,
                user: this.cache.user,
                role: this.cache.role,
                emoji: this.cache.emoji,
                presence: this.cache.presence,
                permOverwrite: this.cache.permOverwrite,
                voiceState: this.cache.voiceState
            }
        });
        if (this.inbound && !this.inbound.ready) {
            await this.inbound.initialize();
        }
        if (this.outbound && !this.outbound.ready) {
            await this.outbound.initialize();
        }
        if (this.inbound) {
            this.inbound.on("event", async (event) => {
                try {
                    await this.eventProcessor.inbound(event);
                    if (this.outbound) {
                        await this.outbound.send(event);
                    }
                }
                catch (e) {
                    this.emit("error", e);
                }
            });
        }
        if (this.options.debug) {
            this.eventProcessor.on("debug", (log) => this.emit("debug", log));
        }
        this.ready = true;
    }
    _createCaches(engines, cacheClasses) {
        const caches = {};
        if (cacheClasses["role"]) {
            const engine = this._getEngine(engines, "role");
            caches["role"] = new cacheClasses["role"](engine);
        }
        if (cacheClasses["emoji"]) {
            const engine = this._getEngine(engines, "emoji");
            caches["emoji"] = new cacheClasses["emoji"](engine);
        }
        if (cacheClasses["permOverwrite"]) {
            const engine = this._getEngine(engines, "permOverwrite");
            caches["permOverwrite"] = new cacheClasses["permOverwrite"](engine);
        }
        if (cacheClasses["user"]) {
            const engine = this._getEngine(engines, "user");
            caches["user"] = new cacheClasses["user"](engine);
        }
        if (cacheClasses["member"]) {
            const engine = this._getEngine(engines, "member");
            caches["member"] = new cacheClasses["member"](engine, caches["user"]);
        }
        if (cacheClasses["presence"]) {
            const engine = this._getEngine(engines, "presence");
            caches["presence"] = new cacheClasses["presence"](engine, caches["user"]);
        }
        if (cacheClasses["channelMap"]) {
            const engine = this._getEngine(engines, "channelMap");
            caches["channelMap"] = new cacheClasses["channelMap"](engine);
        }
        if (cacheClasses["channel"]) {
            const engine = this._getEngine(engines, "channel");
            caches["channel"] = new cacheClasses["channel"](engine, caches["channelMap"], caches["permOverwrite"], caches["user"]);
        }
        if (cacheClasses["guild"]) {
            const engine = this._getEngine(engines, "guild");
            caches["guild"] = new cacheClasses["guild"](engine, caches["channel"], caches["role"], caches["member"], caches["emoji"], caches["presence"], caches["channelMap"]);
        }
        if (cacheClasses["voiceState"]) {
            const engine = this._getEngine(engines, "voiceState");
            caches["voiceState"] = new cacheClasses["voiceState"](engine);
        }
        return caches;
    }
    _getEngine(engines, engine) {
        return engines[engine] || engines["default"];
    }
}
module.exports = RainCache;