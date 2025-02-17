import {PositionCache, Point} from './PositionCache';
import {Player, UserInfo} from '@demostf/demo.js';
import {ViewAngleCache} from "./ViewAngleCache";
import {PlayerMetaCache} from "./PlayerMetaCache";
import {HealthCache} from "./HealthCache";
import {LifeState} from "@demostf/demo.js/build/Data/Player";
import {PlayerResource} from "@demostf/demo.js/build/Data/PlayerResource";
import {SparseDataCache} from "./SparseDataCache";

export class CachedPlayer {
	position: Point;
	user: UserInfo;
	health: number;
	teamId: number;
	classId: number;
	team: string;
	viewAngle: number;
	chargeLevel: number|null;
}

export class PlayerCache {
	tickCount: number;
	positionCache: PositionCache;
	healthCache: HealthCache;
	metaCache: PlayerMetaCache;
	viewAngleCache: ViewAngleCache;
	uberCache: SparseDataCache;

	constructor(tickCount: number, positionOffset: Point) {
		this.tickCount = tickCount;
		this.positionCache = new PositionCache(tickCount, positionOffset);
		this.healthCache = new HealthCache(tickCount);
		this.metaCache = new PlayerMetaCache(tickCount);
		this.viewAngleCache = new ViewAngleCache(tickCount);
		this.uberCache = new SparseDataCache(tickCount, 1, 8, 4);
	}

	setPlayer(tick: number, playerId: number, player: Player, playerResource: PlayerResource) {
		this.positionCache.setPosition(playerId, tick, player.position);
		this.healthCache.set(playerId, tick, player.lifeState === LifeState.ALIVE ? player.health : 0);
		this.metaCache.setMeta(playerId, tick, {
			classId: player.classId,
			teamId: player.team
		});
		this.viewAngleCache.set(playerId, tick, player.viewAngle);
		if (playerResource.chargeLevel > 0) {
			this.uberCache.set(playerId, tick, playerResource.chargeLevel);
		}
	}

	getPlayer(tick: number, playerId: number, user: UserInfo): CachedPlayer {
		const meta = this.metaCache.getMeta(playerId, tick);
		const team = (meta.teamId === 2) ? 'red' : (meta.teamId === 3 ? 'blue' : '');
		return {
			position: this.positionCache.getPosition(playerId, tick),
			user: user,
			health: this.healthCache.get(playerId, tick),
			teamId: meta.teamId,
			classId: meta.classId,
			team,
			viewAngle: this.viewAngleCache.get(playerId, tick),
			chargeLevel: this.uberCache.getOrNull(playerId, tick)
		};
	}

	static rehydrate(data: PlayerCache) {
		PositionCache.rehydrate(data.positionCache);
		HealthCache.rehydrate(data.healthCache);
		PlayerMetaCache.rehydrate(data.metaCache);
		ViewAngleCache.rehydrate(data.viewAngleCache);
		SparseDataCache.rehydrate(data.uberCache);

		Object.setPrototypeOf(data, PlayerCache.prototype);
	}
}
