import { deserialize } from "cerialize";

export class User {
  @deserialize
  public name: string;
  @deserialize
  public age: number;
  @deserialize
  public gender: string;
  constructor(name: string, age: number, gender: string) {
    this.name = name;
    this.age = age;
    this.gender = gender;
  }
}
