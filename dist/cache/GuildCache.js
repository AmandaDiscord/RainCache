"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const BaseCache_1 = __importDefault(require("./BaseCache"));
class GuildCache extends BaseCache_1.default {
    constructor(storageEngine, channelCache, roleCache, memberCache, emojiCache, presenceCache, guildToChannelCache, boundObject) {
        super();
        this.storageEngine = storageEngine;
        this.namespace = "guild";
        this.channels = channelCache;
        this.roles = roleCache;
        this.members = memberCache;
        this.emojis = emojiCache;
        this.presences = presenceCache;
        this.guildChannelMap = guildToChannelCache;
        if (boundObject) {
            this.bindObject(boundObject);
        }
    }
    async get(id) {
        if (this.boundObject) {
            return this;
        }
        const guild = await this.storageEngine.get(this.buildId(id));
        if (guild) {
            return new GuildCache(this.storageEngine, this.channels.bindGuild(guild.id), this.roles.bindGuild(guild.id), this.members.bindGuild(guild.id), this.emojis.bindGuild(guild.id), this.presences.bindGuild(guild.id), this.guildChannelMap.bindGuild(guild.id), guild);
        }
        else {
            return null;
        }
    }
    async update(id, data) {
        if (this.boundObject) {
            this.bindObject(data);
        }
        if (data.channels && data.channels.length > 0) {
            await this.guildChannelMap.update(id, data.channels.map(c => c.id));
            for (const channel of data.channels) {
                channel.guild_id = id;
                await this.channels.update(channel.id, channel);
            }
        }
        if (data.members && data.members.length > 0) {
            const membersPromiseBatch = [];
            for (const member of data.members) {
                member.guild_id = id;
                membersPromiseBatch.push(this.members.update(member.user.id, id, member));
            }
            await Promise.all(membersPromiseBatch);
        }
        if (data.presences && data.presences.length > 0) {
            const presencePromiseBatch = [];
            for (const presence of data.presences) {
                presencePromiseBatch.push(this.presences.update(presence.user.id, presence));
            }
            await Promise.all(presencePromiseBatch);
        }
        if (data.roles && data.roles.length > 0) {
            const rolePromiseBatch = [];
            for (const role of data.roles) {
                rolePromiseBatch.push(this.roles.update(role.id, id, role));
            }
            await Promise.all(rolePromiseBatch);
        }
        if (data.emojis && data.emojis.length > 0) {
            const emojiPromiseBatch = [];
            for (const emoji of data.emojis) {
                emojiPromiseBatch.push(this.emojis.update(emoji.id, id, emoji));
            }
            await Promise.all(emojiPromiseBatch);
        }
        delete data.members;
        delete data.voice_states;
        delete data.roles;
        delete data.presences;
        delete data.emojis;
        delete data.features;
        delete data.channels;
        await this.addToIndex([id]);
        await this.storageEngine.upsert(this.buildId(id), data);
        if (this.boundObject)
            return this;
        const guild = await this.storageEngine.get(this.buildId(id));
        return new GuildCache(this.storageEngine, this.channels.bindGuild(guild.id), this.roles.bindGuild(guild.id), this.members.bindGuild(guild.id), this.emojis.bindGuild(guild.id), this.presences.bindGuild(guild.id), this.guildChannelMap.bindGuild(guild.id), guild);
    }
    async remove(id) {
        const guild = await this.storageEngine.get(this.buildId(id));
        if (guild) {
            const channelMap = await this.guildChannelMap.get(id);
            const roles = await this.roles.getIndexMembers(id);
            const emojis = await this.emojis.getIndexMembers(id);
            const members = await this.members.getIndexMembers(id);
            for (const emoji of emojis) {
                await this.emojis.remove(emoji, id);
            }
            for (const role of roles) {
                await this.roles.remove(role, id);
            }
            for (const channel of channelMap.boundObject?.channels) {
                await this.channels.remove(channel);
            }
            for (const member of members) {
                await this.members.remove(member, id);
            }
            await this.guildChannelMap.remove(id);
            await this.removeFromIndex(id);
            return this.storageEngine.remove(this.buildId(id));
        }
        else {
            return null;
        }
    }
    async filter(fn) {
        const guilds = await this.storageEngine.filter(fn, undefined, this.namespace);
        return guilds.map(g => new GuildCache(this.storageEngine, this.channels, this.roles.bindGuild(g.id), this.members.bindGuild(g.id), this.emojis.bindGuild(g.id), this.presences.bindGuild(g.id), this.guildChannelMap.bindGuild(g.id), g));
    }
    async find(fn) {
        const guild = await this.storageEngine.find(fn, undefined, this.namespace);
        if (!guild)
            return null;
        return new GuildCache(this.storageEngine, this.channels.bindGuild(guild.id), this.roles.bindGuild(guild.id), this.members.bindGuild(guild.id), this.emojis.bindGuild(guild.id), this.presences.bindGuild(guild.id), this.guildChannelMap.bindGuild(guild.id), guild);
    }
    async addToIndex(ids) {
        return this.storageEngine.addToList(this.namespace, ids);
    }
    async removeFromIndex(id) {
        return this.storageEngine.removeFromList(this.namespace, id);
    }
    async isIndexed(id) {
        return this.storageEngine.isListMember(this.namespace, id);
    }
    async getIndexMembers() {
        return this.storageEngine.getListMembers(this.namespace);
    }
    async removeIndex() {
        return this.storageEngine.removeList(this.namespace);
    }
    async getIndexCount() {
        return this.storageEngine.getListCount(this.namespace);
    }
}
module.exports = GuildCache;