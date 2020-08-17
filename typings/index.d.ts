import events = require("events");

import BaseConnector = require("../src/connector/BaseConnector");
import BaseStorageEngine = require("../src/storageEngine/BaseStorageEngine");

import GuildCache = require("../src/cache/GuildCache");
import ChannelCache = require("../src/cache/ChannelCache");
import ChannelMap = require("../src/cache/ChannelMapCache");
import MemberCache = require("../src/cache/MemberCache");
import UserCache = require("../src/cache/UserCache");
import RoleCache = require("../src/cache/RoleCache");
import EmojiCache = require("../src/cache/EmojiCache");
import PresenceCache = require("../src/cache/PresenceCache");
import PermissionsOverwriteCache = require("../src/cache/PermissionOverwriteCache");

import AmqpConnector = require("../src/connector/AmqpConnector");
import DirectConnector = require("../src/connector/DirectConnector");

import RedisStorageEngine = require("../src/storageEngine/RedisStorageEngine");

export type RainCacheOptions = {
	debug?: boolean;
	storage?: {
		default: BaseStorageEngine;
		guild?: BaseStorageEngine;
		channel?: BaseStorageEngine;
		channelMap?: BaseStorageEngine;
		member?: BaseStorageEngine;
		user?: BaseStorageEngine;
		role?: BaseStorageEngine;
		emoji?: BaseStorageEngine;
		presence?: BaseStorageEngine;
		permOverwrite?: BaseStorageEngine;
	};
	disabledEvents?: {
		[event: string]: boolean;
	};
	cacheClasses: {
		guild?: GuildCache;
		channel?: ChannelCache;
		channelMap?: ChannelMap;
		member?: MemberCache;
		user?: UserCache;
		role?: RoleCache;
		emoji?: EmojiCache;
		presence?: PresenceCache;
		permOverwrite?: PermissionsOverwriteCache;
	};
}

class RainCache<Inbound extends BaseConnector, Outbound extends BaseConnector> extends events.EventEmitter {
	constructor(options: RainCacheOptions, inboundConnector?: Inbound, outboundConnector?: Outbound);

	public options: RainCacheOptions;
	public ready: boolean;
	public inbound: Inbound;
	public outbound: Outbound;

	public static Connectors: {
		AmqpConnector: AmqpConnector;
		DirectConnector: DirectConnector;
	};
	public static Engines: {
		RedisStorageEngine: RedisStorageEngine;
	};

	public guild: RainCacheOptions["cacheClasses"]["guild"];
	public channel: RainCacheOptions["cacheClasses"]["channel"];
	public channelMap: RainCacheOptions["cacheClasses"]["channelMap"];
	public member: RainCacheOptions["cacheClasses"]["member"];
	public user: RainCacheOptions["cacheClasses"]["user"];
	public role: RainCacheOptions["cacheClasses"]["role"];
	public emoji: RainCacheOptions["cacheClasses"]["emoji"];
	public presence: RainCacheOptions["cacheClasses"]["presence"];
	public permOverwrite?: RainCacheOptions["cacheClasses"]["permOverwrite"];


	public initialize(): Promise<void>;
	// I'm really not sure if I typed these correctly. The code is actually very confusing to read. All I know is it works.
	private _createCaches(engines: RainCacheOptions["cacheClasses"], cacheClasses: RainCacheOptions["cacheClasses"]): RainCacheOptions["cacheClasses"];
	private _getEngine(engines: RainCacheOptions["cacheClasses"], engine: keyof RainCacheOptions["cacheClasses"]): BaseStorageEngine;
}

export = RainCache;
