import test from "node:test";
import assert from "node:assert/strict";
import {emptyNotes,noteKeys,validNotes} from "../src/server/reports/draft-notes";
test("introduction, conclusion et six commentaires vides par défaut",()=>{
 const notes=emptyNotes();assert.equal(noteKeys.length,8);
 assert.ok(noteKeys.every(k=>notes[k].text===""&&notes[k].included));
 assert.equal(validNotes(notes),true);
});
test("langue et inclusion explicites, aucun texte inventé",()=>{
 const notes=emptyNotes();notes.introduction={text:"Texte original",language:"fr",included:false};
 assert.equal(validNotes(notes),true);
 assert.equal(validNotes({...notes,another:{text:"x",language:"fr",included:true}}),false);
 assert.equal(validNotes({...notes,conclusion:{text:"x",language:"de",included:true}}),false);
});
