  </section>

  <section className="smn-team-results" aria-label={t("teamCockpit.membersHeading")}>
   {status==="loading"&&<p role="status">{t("members.loading")}</p>}
   {status==="error"&&<p role="alert">{t("members.loadFailed")}</p>}
   {status==="ready"&&roster?.members.length===0&&
    <div className="alert alert-info mb-0">{t("teamUX.notInitialized")}{" "}
     {canManage&&<Link href="/app/admin/members/manage" className="alert-link">
      {t("teamUX.initialize")}</Link>}
    </div>}
   {status==="ready"&&roster&&roster.members.length>0&&<>
    {members.length===0&&<p role="status" className="smn-team-no-results">
     {t("teamCockpit.noResults")}
    </p>}
    {view==="cards"?
     <div className="smn-team-member-grid">
      {Array.from({length:capacity},(_,index)=>{
       const member=members[index];
       return member?
        <Link key={member.id} href={memberHref(member)}
         className="smn-team-member-card text-decoration-none"
         aria-label={t("teamUX.openMember",{name:member.displayName})}>
         <div className="smn-team-member-name">
          <CountryFlag countryIso2={member.countryIso2}/>
          <strong>{member.displayName}</strong>
         </div>
         <NeutralAvatar size={60}/>
         <div className="smn-team-member-roles">
          {roles(member).map(([name,share])=>roleBadge(name,share))}
         </div>
         <p className="smn-team-member-function">
          {member.professionalFunction?.trim()||t("teamUX.functionMissing")}
         </p>
         {member.archived&&<span className="smn-team-member-status">
          {t("teamCockpit.archived")}</span>}
         {!member.archived&&member.isProvisional&&<span className="smn-team-member-status">
          {t("teamCockpit.provisional")}</span>}
        </Link>:canAdd&&index===members.length?
        <button key={"slot-"+index} type="button"
         className="smn-team-add-tile" onClick={()=>setCreationOpen(true)}>
         <span aria-hidden="true" className="smn-team-plus">+</span><strong>{t("teamUX.addMember")}</strong>
        </button>:
        <div key={"slot-"+index} className="smn-team-empty-slot" aria-hidden="true"/>;
      })}
     </div>:
     <div className="smn-team-list-table-wrapper">
      <table className="table table-hover align-middle smn-team-list-table">
       <thead><tr>
        <th scope="col">{t("teamUX.member")}</th>
        <th scope="col">{t("teamUX.roles")}</th>
        <th scope="col">{t("teamCockpit.functionLabel")}</th>
        <th scope="col">{t("teamCockpit.statusLabel")}</th>
        <th scope="col">{t("teamUX.details")}</th>
       </tr></thead>
       <tbody>{members.map(member=><tr key={member.id}
        role="link" tabIndex={0} className="smn-team-list-row"
        aria-label={t("teamUX.openMember",{name:member.displayName})}
        onClick={()=>router.push(memberHref(member))}
        onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){
         e.preventDefault();router.push(memberHref(member));
        }}}>
        <th scope="row"><span className="smn-team-list-name">
         <CountryFlag countryIso2={member.countryIso2}/>{member.displayName}
        </span></th>
        <td><div className="smn-team-member-roles">
         {roles(member).map(([name,share])=>roleBadge(name,share))}
        </div></td>
        <td>{member.professionalFunction?.trim()||t("teamUX.functionMissing")}</td>
        <td>{memberStatus(member)}</td>
        <td><BootstrapIcon name="arrow-right"/></td>
       </tr>)}</tbody>
      </table>
      {canAdd&&<button type="button" className="btn btn-outline-primary mt-2"
       onClick={()=>setCreationOpen(true)}>
       <span aria-hidden="true" className="smn-team-plus">+</span> {t("teamUX.addMember")}
      </button>}
     </div>}
   </>}
  </section>

  {creationOpen&&canAdd&&<div className="modal d-block" role="dialog"
   aria-modal="true" aria-labelledby="team-create-title"
   style={{background:"rgba(0,0,0,.5)"}}>
   <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
    <div className="modal-header"><h2 className="modal-title fs-5" id="team-create-title">
     {t("teamUX.addMember")}</h2>
     <button className="btn-close" aria-label={t("teamUX.cancel")}
      onClick={()=>setCreationOpen(false)}/></div>
    <form onSubmit={e=>void createOne(e)}>
     <div className="modal-body">
      <label className="form-label" htmlFor="new-team-member">{t("teamUX.memberName")}</label>
      <input id="new-team-member" className="form-control"
       maxLength={120} required autoFocus value={newName} disabled={creating}
       onChange={e=>{setNewName(e.target.value);setCreateError("");requestId.current=null;}}/>
      <p className="small text-secondary mt-2">{t("teamUX.defaultRole")}</p>
      {createError&&<p role="alert" className="alert alert-warning">
       {t("teamUX.createError",{reason:createError})}</p>}
     </div>
     <div className="modal-footer">
      <button type="button" className="btn btn-secondary" disabled={creating}
       onClick={()=>setCreationOpen(false)}>{t("teamUX.cancel")}</button>
      <button type="submit" className="btn btn-primary"
       disabled={creating||!newName.trim()}>{t("teamUX.create")}</button>
     </div>
    </form>
   </div></div>
  </div>}
 </section>;
}
