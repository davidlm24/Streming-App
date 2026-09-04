sed -i '2455,2477c\
                              {isActive && (\
                                <span className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">\
                                  <span className="bg-blue-500 text-white rounded-full p-0.5"><Check size={8} /></span>\
                                </span>\
                              )}\
                              <div \
                                onClick={(e) => { e.stopPropagation(); deleteCustomBackground(tmpl.id); }}\
                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"\
                                title="Remover"\
                              >\
                                <Trash2 size={12} />\
                              </div>\
                            </button>\
                          );\
                        })}
' src/components/LeftSidebar.tsx
