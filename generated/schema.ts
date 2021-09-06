// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class MonsterMap extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save MonsterMap entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save MonsterMap entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("MonsterMap", id.toString(), this);
  }

  static load(id: string): MonsterMap | null {
    return store.get("MonsterMap", id) as MonsterMap | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get tokenID(): BigInt {
    let value = this.get("tokenID");
    return value.toBigInt();
  }

  set tokenID(value: BigInt) {
    this.set("tokenID", Value.fromBigInt(value));
  }

  get owner(): string {
    let value = this.get("owner");
    return value.toString();
  }

  set owner(value: string) {
    this.set("owner", Value.fromString(value));
  }

  get monsters(): Array<string> {
    let value = this.get("monsters");
    return value.toStringArray();
  }

  set monsters(value: Array<string>) {
    this.set("monsters", Value.fromStringArray(value));
  }

  get mintTime(): BigInt {
    let value = this.get("mintTime");
    return value.toBigInt();
  }

  set mintTime(value: BigInt) {
    this.set("mintTime", Value.fromBigInt(value));
  }

  get tokenURI(): string {
    let value = this.get("tokenURI");
    return value.toString();
  }

  set tokenURI(value: string) {
    this.set("tokenURI", Value.fromString(value));
  }
}

export class Owner extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Owner entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Owner entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Owner", id.toString(), this);
  }

  static load(id: string): Owner | null {
    return store.get("Owner", id) as Owner | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get monsterMaps(): Array<string> {
    let value = this.get("monsterMaps");
    return value.toStringArray();
  }

  set monsterMaps(value: Array<string>) {
    this.set("monsterMaps", Value.fromStringArray(value));
  }

  get monsterMapCount(): BigInt {
    let value = this.get("monsterMapCount");
    return value.toBigInt();
  }

  set monsterMapCount(value: BigInt) {
    this.set("monsterMapCount", Value.fromBigInt(value));
  }
}

export class Monster extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Monster entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Monster entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Monster", id.toString(), this);
  }

  static load(id: string): Monster | null {
    return store.get("Monster", id) as Monster | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get monsterMaps(): Array<string> {
    let value = this.get("monsterMaps");
    return value.toStringArray();
  }

  set monsterMaps(value: Array<string>) {
    this.set("monsterMaps", Value.fromStringArray(value));
  }
}
