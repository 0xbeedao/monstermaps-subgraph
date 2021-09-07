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

function setCharAt(str: string, index: i32, char: string): string {
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

/* function getMonsterForMap(mapId: BigInt, monsterId: string): Monster {
  let monster = Monster.load(monsterId);
  let maps: string[] = [];
  if (!monster) {
    monster = new Monster(monsterId);
  } else {
    maps = monster.monsterMaps;
  }
  let found = false;
  for (let i=0; i < maps.length; i++) {
    let currentId = maps[i]; 
    if (currentId === monsterId) {
      found = true;
      break;
    }
  }
  if (!found) {
    maps.push(mapId.toString());
  }
  monster.monsterMaps = maps;
  monster.save()
  return monster;
} */

function ensureMonster(id: BigInt): void {
  let key: string = id.toString();
  let monster = Monster.load(key);
  if (!monster) {
    monster = new Monster(key);
    monster.save();
  }
}

function saveMapWithOwner(owner: Owner|null, event: Transfer): void {
  let tokenId = event.params.tokenId;
  let map = MonsterMap.load(tokenId.toString());
  if (map == null) {
      map = new MonsterMap(tokenId.toString());
      map.tokenID = tokenId;
      map.mintTime = event.block.timestamp;
      map.tokenURI = ""
  }
  let mapContract: MonsterMaps;
  let monsters = map.monsters;
  if (map.tokenURI == "" || monsters.length == 0) {
    mapContract = MonsterMaps.bind(event.address)
  
    if (map.tokenURI == "") {
      let metadataURI = mapContract.try_tokenURI(tokenId);
      if (!metadataURI.reverted) {
        map.tokenURI = normalize(metadataURI.value);
      }
    }

    if (monsters.length == 0) {
      let monsterIds = mapContract.getMonsterIds(tokenId);
      for (let i=0; i < monsterIds.length; i++) {
        ensureMonster(monsterIds[i]);
        monsters.push(monsterIds[i].toString());
      }
    }
  }
  map.monsters = monsters;
  map.owner = owner.id;
  map.save();
}

function handleTransferExisting(event: Transfer): void {
  // an existing token will already have an Owner and the map will have its tokenURI and monsters
  let tokenId = event.params.tokenId;
  let from = event.params.from;
  let to = event.params.to;

  // so, just remove ownership from current
  let currentOwner = Owner.load(from.toHex());
  if (currentOwner != null) {
    currentOwner.monsterMapCount = currentOwner.monsterMapCount.minus(BigInt.fromI32(1));
    currentOwner.save();
  }

  // add ownership to new
  let newOwner = Owner.load(to.toHex());
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
  let address = event.address;
  let tokenId = event.params.tokenId;
  let from = event.params.from;
  let to = event.params.to;


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
  let tokenId = event.params.tokenId;
  let from = event.params.from;

  let burnOwner = Owner.load(from.toHex());
  if (burnOwner) {
    burnOwner.monsterMapCount = burnOwner.monsterMapCount.minus(BigInt.fromI32(1));
  }
  store.remove('MonsterMap', tokenId.toString());
}
 
export function handleTransfer(event: Transfer): void {
  let tokenId = event.params.tokenId;
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
