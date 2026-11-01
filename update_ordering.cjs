const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const target = `                        </div>
                      )}
                    </motion.div>`;
const replacement = `                        </div>
                      )}
                      {orderingChecked && (
                        <div className="absolute bottom-4 right-4 opacity-80 pointer-events-none">
                          {isCorrect 
                            ? <CheckCircle className="w-12 h-12 text-emerald-500" /> 
                            : <XCircle className="w-12 h-12 text-rose-500" />}
                        </div>
                      )}
                    </motion.div>`;
content = content.replace(target, replacement);

fs.writeFileSync('src/components/Practice.tsx', content);
