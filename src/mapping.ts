import { store, BigInt, ethereum } from "@graphprotocol/graph-ts"
import {
  MonsterMaps,
  Transfer
} from "../generated/MonsterMaps/MonsterMaps"

import {
  MonsterMap,
  Owner,
  Monster,
} from "../generated/schema"

const zeroAddress = '0x0000000000000000000000000000000000000000';

function setCharAt(str: string, index: number, char: string): string {
  if(index > str.length-1) return str;
  return str.substr(0,index) + char + str.substr(index+1);
}

function normalize(strValue: string): string {
  if (strValue.length === 1 && strValue.charCodeAt(0) === 0) {
      return "";    
  } else {
      for (let i = 0; i < strValue.length; i++) {
          if (strValue.charCodeAt(i) === 0) {
              strValue = setCharAt(strValue, i, '\ufffd'); // graph-node db does not support string with '\u0000'
          }
      }
      return strValue;
  }
}

function saveMapWithMonster(monsterMap: MonsterMap, monsterId: string, event: Transfer): Monster {
  let monster: Monster = Monster.load(monsterId);
  if (!monster) {
    monster = new Monster(monsterId);
    monster.monsterMaps = [];
  }
  if (!(monsterMap.id in monster.monsterMaps)) {
    monster.monsterMaps.push(monsterMap.id);
  }
  monster.save()
  return monster;
}

function saveMapWithOwner(owner: Owner, event: Transfer): MonsterMap {
  const {params: {tokenId}} = event;
  let map: MonsterMap = MonsterMap.load(tokenId.toString());
  if (map == null) {
      map = new MonsterMap(tokenId.toString());
      map.tokenID = tokenId;
      map.mintTime = event.block.timestamp;
      map.tokenURI = ""
      map.monsters = [];
  }
  let mapContract: MonsterMaps;
  if (map.tokenURI === "" || map.monsters.length === 0) {
    mapContract = MonsterMaps.bind(event.address)
  }
  if (map.tokenURI === "") {
    const metadataURI = mapContract.try_tokenURI(tokenId);
    if (!metadataURI.reverted) {
      map.tokenURI = normalize(metadataURI.value);
    }
  }
  if (map.monsters.length === 0) {
    const monsterCall = mapContract.try_getMonsterIds(tokenId);
    if (!monsterCall.reverted) {
      map.monsters = monsterCall.value.map(x => x.toString());
      map.monsters.map(monsterId => {
        saveMapWithMonster(map, monsterId, event);
      });
    } else {
      map.monsters = [];
    }
  }
  map.owner = owner.id;
  map.save();
  return map;
}

function handleTransferExisting(event: Transfer): void {
  // an existing token will already have an Owner and the map will have its tokenURI and monsters
  const {params: {tokenId, from, to}} = event;

  // so, just remove ownership from current
  const currentOwner: Owner = Owner.load(from.toHex());
  if (currentOwner != null) {
    currentOwner.monsterMapCount = currentOwner.monsterMapCount.minus(BigInt.fromI32(1));
    currentOwner.save();
  }

  // add ownership to new
  let newOwner: Owner = Owner.load(to.toHex());
  if (newOwner == null) { // create it if missing
      newOwner = new Owner(to.toHex());
      newOwner.monsterMapCount = BigInt.fromI32(0);
  }
  newOwner.monsterMapCount = newOwner.monsterMapCount.plus(BigInt.fromI32(1));
  newOwner.save();

  // Should already have a map, but do it this way for safety
  saveMapWithOwner(newOwner, event);
}

function handleMint(event: Transfer): void {
  const {
    address,
    params: {tokenId, from, to}
  } = event;

  let newOwner = Owner.load(to.toHex());
  if (newOwner == null) {
      newOwner = new Owner(to.toHex());
      newOwner.monsterMapCount = BigInt.fromI32(0);
  }
  newOwner.monsterMapCount = newOwner.monsterMapCount.plus(BigInt.fromI32(1));
  newOwner.save();

  saveMapWithOwner(newOwner, event);
}

function handleBurn(event: Transfer): void {
  const {params: {tokenId, from}} = event;
  const burnOwner = Owner.load(from.toHex());
  if (burnOwner) {
    burnOwner.monsterMapCount = burnOwner.monsterMapCount.minus(BigInt.fromI32(1));
  }
  store.remove('MonsterMap', tokenId.toString());
}
 
export function handleTransfer(event: Transfer): void {
  const {params: {tokenId}} = event;
  let from = event.params.from.toHex();
  let to = event.params.to.toHex();

  if (from != zeroAddress || to != zeroAddress) { // skip if from zero to zero
    if (from != zeroAddress) { // existing token
      handleTransferExisting(event);
    } else if (to != zeroAddress) {
      handleMint(event);
    } else { // burn
      handleBurn(event);
    }
  }
}
