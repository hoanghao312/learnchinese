const regex = /onResetProgress=\{\(folderId, mode\) => \{/;
console.log(regex.test(`onResetProgress={(folderId, mode) => {`));
