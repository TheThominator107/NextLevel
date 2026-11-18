"""Tokenizer: string and template literals in a JS file (used by i18n_extract.py)."""
import re,sys,json
def literals(src):
    out=[];i=0;n=len(src)
    while i<n:
        c=src[i]
        if c=='/' and i+1<n and src[i+1]=='/':
            j=src.find('\n',i); i=n if j<0 else j; continue
        if c=='/' and i+1<n and src[i+1]=='*':
            j=src.find('*/',i+2); i=n if j<0 else j+2; continue
        if c in '"\'':
            j=i+1; buf=''
            while j<n and src[j]!=c:
                if src[j]=='\\': buf+=src[j:j+2]; j+=2; continue
                if src[j]=='\n': break
                buf+=src[j]; j+=1
            out.append(buf); i=j+1; continue
        if c=='`':
            j=i+1; buf=''; depth=0
            while j<n:
                if src[j]=='\\': buf+=src[j:j+2]; j+=2; continue
                if src[j]=='`': break
                if src[j]=='$' and j+1<n and src[j+1]=='{':
                    # skip balanced expression, recurse literals inside
                    k=j+2; d=1; start=k
                    while k<n and d>0:
                        ch=src[k]
                        if ch in '"\'`':
                            # skip nested literal roughly via recursion
                            sub,endk=skip_lit(src,k); k=endk; continue
                        if ch=='{': d+=1
                        elif ch=='}': d-=1
                        k+=1
                    out.extend(literals(src[start:k-1]))
                    buf+='\x00'; j=k; continue
                buf+=src[j]; j+=1
            out.append(buf); i=j+1; continue
        i+=1
    return out
def skip_lit(src,k):
    q=src[k]; j=k+1
    if q=='`':
        while j<len(src):
            if src[j]=='\\': j+=2; continue
            if src[j]=='`': return None,j+1
            if src[j]=='$' and src[j+1]=='{':
                d=1; j+=2
                while d>0 and j<len(src):
                    if src[j] in '"\'`': _,j=skip_lit(src,j); continue
                    if src[j]=='{': d+=1
                    elif src[j]=='}': d-=1
                    j+=1
                continue
            j+=1
        return None,j
    while j<len(src) and src[j]!=q:
        if src[j]=='\\': j+=2; continue
        j+=1
    return None,j+1
