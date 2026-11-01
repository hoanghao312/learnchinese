function fixHistory(history) {
  const validHistory = [];
  let expectedRole = 'user';
  
  for (const msg of history) {
    if (msg.role === expectedRole) {
      validHistory.push(msg);
      expectedRole = expectedRole === 'user' ? 'model' : 'user';
    } else if (msg.role === 'model' && validHistory.length === 0) {
       // skip first model msg
    } else if (msg.role === validHistory[validHistory.length - 1].role) {
       // merge
       validHistory[validHistory.length - 1].parts[0].text += "\n" + msg.parts[0].text;
    }
  }
  return validHistory;
}
